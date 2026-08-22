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

const supabase = createClient(supabaseUrl, supabaseAnonKey);

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

  const { data: item, error: itemError } = await supabase
    .from("items")
    .select("id, title")
    .limit(1)
    .single();

  if (itemError || !item) {
    console.error("❌ Failed to fetch test item:", itemError?.message);
    process.exitCode = 1;
    return;
  }

  console.log(`📌 Target Exhibit: ${item.title} (${item.id})\n`);

  try {
    await supabase
      .from("shinmiri_reactions")
      .delete()
      .eq("item_id", item.id)
      .eq("user_id", user.id);

    const { count: baselineCount, error: baselineError } = await supabase
      .from("shinmiri_reactions")
      .select("id", { count: "exact", head: true })
      .eq("item_id", item.id);

    if (baselineError || baselineCount === null) {
      console.error("❌ Failed to fetch baseline reaction count:", baselineError?.message);
      process.exitCode = 1;
      return;
    }

    const { error: insertError } = await supabase
      .from("shinmiri_reactions")
      .insert({
        item_id: item.id,
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
      .eq("item_id", item.id);

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
        item_id: item.id,
        user_id: user.id,
      });

    if (duplicateError) {
      console.log("✅ Duplicate reaction prevented by UNIQUE constraint.");
    } else {
      console.error("❌ Duplicate reaction was NOT prevented!");
      process.exitCode = 1;
      return;
    }

    const { error: deleteError } = await supabase
      .from("shinmiri_reactions")
      .delete()
      .eq("item_id", item.id)
      .eq("user_id", user.id);

    if (deleteError) {
      console.error("❌ Delete reaction failed:", deleteError.message);
      process.exitCode = 1;
      return;
    }

    const { count: countAfterDelete, error: countDeleteError } = await supabase
      .from("shinmiri_reactions")
      .select("id", { count: "exact", head: true })
      .eq("item_id", item.id);

    if (countDeleteError || countAfterDelete !== baselineCount) {
      console.error(
        `❌ Reaction count after remove is invalid. Expected: ${baselineCount}, Actual: ${countAfterDelete}`
      );
      process.exitCode = 1;
      return;
    }
    console.log(`✅ Shinmiri reaction REMOVED successfully (Count: ${countAfterDelete}).`);
  } finally {
    await supabase
      .from("shinmiri_reactions")
      .delete()
      .eq("item_id", item.id)
      .eq("user_id", user.id);
  }

  if (process.exitCode === 1) {
    console.error("\n⚠️ Test finished with errors.");
  } else {
    console.log("\n🎉 Shinmiri Reaction Backend Flow Test Passed!");
  }
}

testShinmiriFlow();
