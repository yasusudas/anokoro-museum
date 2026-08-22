import { createClient } from "@supabase/supabase-js";
import fs from "fs";

if (fs.existsSync(".env.local")) {
  const envContent = fs.readFileSync(".env.local", "utf-8");
  for (const line of envContent.split("\n")) {
    const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
    if (match) {
      const key = match[1];
      const value = match[2] ? match[2].trim().replace(/^['"]|['"]$/g, "") : "";
      process.env[key] = value;
    }
  }
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseAnonKey);
const adminSupabase = serviceRoleKey ? createClient(supabaseUrl, serviceRoleKey) : null;

async function testShinmiriFlow() {
  console.log("🧪 Starting Shinmiri Reaction Test...\n");

  const testEmail = process.env.TEST_USER_EMAIL || "test_runner@anokoro.local";
  const testPassword = process.env.TEST_USER_PASSWORD || "TestRunnerPassword123!";

  const signInResult = await supabase.auth.signInWithPassword({
    email: testEmail,
    password: testPassword,
  });

  let user = signInResult.data.user;
  let session = signInResult.data.session;

  if (!user || !session) {
    const signUpResult = await supabase.auth.signUp({
      email: testEmail,
      password: testPassword,
    });
    user = signUpResult.data.user;
    session = signUpResult.data.session;
  }

  if (!user || !session) {
    console.error("❌ Authentication failed");
    process.exitCode = 1;
    return;
  }

  console.log(`✅ Authenticated user: ${user.id}`);

  let targetItemId: string;
  let isDynamicFixture = false;

  if (adminSupabase) {
    const { data: fixtureItem, error: createFixtureError } = await adminSupabase
      .from("items")
      .insert({
        user_id: user.id,
        title: `しんみり検証用展示_${Date.now()}`,
        description: "しんみりトグル機能の分離テスト用一時アイテムです。",
        category: "ゲーム",
        year: 2020,
      })
      .select("id, title")
      .single();

    if (createFixtureError || !fixtureItem) {
      console.error("❌ Failed to create isolated test exhibit:", createFixtureError?.message);
      process.exitCode = 1;
      return;
    }

    targetItemId = fixtureItem.id;
    isDynamicFixture = true;
    console.log(`📌 Isolated Test Exhibit Created: ${fixtureItem.title} (${targetItemId})\n`);
  } else {
    const { data: existingItem, error: fetchError } = await supabase
      .from("items")
      .select("id, title")
      .limit(1)
      .single();

    if (fetchError || !existingItem) {
      console.error("❌ Failed to fetch existing exhibit item:", fetchError?.message);
      process.exitCode = 1;
      return;
    }

    targetItemId = existingItem.id;
    console.log(`📌 Using Existing Exhibit: ${existingItem.title} (${targetItemId})\n`);
  }

  try {
    await supabase
      .from("shinmiri_reactions")
      .delete()
      .eq("item_id", targetItemId)
      .eq("user_id", user.id);

    const { count: baselineCount, error: baselineError } = await supabase
      .from("shinmiri_reactions")
      .select("id", { count: "exact", head: true })
      .eq("item_id", targetItemId);

    if (baselineError || baselineCount === null) {
      console.error("❌ Failed to fetch baseline reaction count:", baselineError?.message);
      process.exitCode = 1;
      return;
    }

    const { error: insertError } = await supabase
      .from("shinmiri_reactions")
      .insert({
        item_id: targetItemId,
        user_id: user.id,
      });

    if (insertError) {
      console.error("❌ Insert reaction failed:", insertError.message);
      process.exitCode = 1;
      return;
    }

    const { count: countAfterAdd, error: countAddError } = await supabase
      .from("shinmiri_reactions")
      .select("id", { count: "exact", head: true })
      .eq("item_id", targetItemId);

    if (countAddError || countAfterAdd !== baselineCount + 1) {
      console.error(
        `❌ Reaction count after add is invalid. Expected: ${baselineCount + 1}, Actual: ${countAfterAdd}`
      );
      process.exitCode = 1;
      return;
    }
    console.log(`✅ Shinmiri reaction ADDED successfully (Count: ${countAfterAdd}).`);

    const { error: duplicateError } = await supabase
      .from("shinmiri_reactions")
      .insert({
        item_id: targetItemId,
        user_id: user.id,
      });

    if (duplicateError?.code === "23505") {
      console.log("✅ Duplicate reaction prevented by UNIQUE constraint (PostgreSQL code 23505).");
    } else {
      console.error(
        `❌ Duplicate reaction was NOT prevented by UNIQUE constraint (Code: ${duplicateError?.code}, Message: ${duplicateError?.message})`
      );
      process.exitCode = 1;
      return;
    }

    const { error: deleteError } = await supabase
      .from("shinmiri_reactions")
      .delete()
      .eq("item_id", targetItemId)
      .eq("user_id", user.id);

    if (deleteError) {
      console.error("❌ Delete reaction failed:", deleteError.message);
      process.exitCode = 1;
      return;
    }

    const { count: countAfterDelete, error: countDeleteError } = await supabase
      .from("shinmiri_reactions")
      .select("id", { count: "exact", head: true })
      .eq("item_id", targetItemId);

    if (countDeleteError || countAfterDelete !== baselineCount) {
      console.error(
        `❌ Reaction count after remove is invalid. Expected: ${baselineCount}, Actual: ${countAfterDelete}`
      );
      process.exitCode = 1;
      return;
    }
    console.log(`✅ Shinmiri reaction REMOVED successfully (Count: ${countAfterDelete}).`);
  } finally {
    const { error: reactionCleanupError } = await supabase
      .from("shinmiri_reactions")
      .delete()
      .eq("item_id", targetItemId)
      .eq("user_id", user.id);

    if (reactionCleanupError) {
      console.error("⚠️ Failed to clean up reaction:", reactionCleanupError.message);
      process.exitCode = 1;
    }

    if (isDynamicFixture && adminSupabase) {
      const { error: adminDeleteError } = await adminSupabase
        .from("items")
        .delete()
        .eq("id", targetItemId);

      if (adminDeleteError) {
        console.error("⚠️ Failed to clean up fixture item:", adminDeleteError.message);
        process.exitCode = 1;
      } else {
        console.log("🧹 Cleaned up isolated test exhibit.");
      }
    }
  }

  if (process.exitCode === 1) {
    console.error("\n⚠️ Test finished with errors.");
  } else {
    console.log("\n🎉 Shinmiri Reaction Test Passed!");
  }
}

testShinmiriFlow();
