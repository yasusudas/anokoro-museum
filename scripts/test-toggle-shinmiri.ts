import { createClient } from "@supabase/supabase-js";
import fs from "fs";

const envContent = fs.readFileSync(".env.local", "utf-8");
for (const line of envContent.split("\n")) {
  const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
  if (match) {
    const key = match[1];
    const value = match[2] ? match[2].trim().replace(/^['"]|['"]$/g, "") : "";
    process.env[key] = value;
  }
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testShinmiriFlow() {
  console.log("🧪 Starting Shinmiri Reaction Test...\n");

  const testEmail = "test_runner@anokoro.local";
  const testPassword = "TestRunnerPassword123!";

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

  // テスト用展示アイテムを1件取得
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
    // 既存のテストユーザーのリアクションがあれば一度削除してクリーンな状態に
    await supabase
      .from("shinmiri_reactions")
      .delete()
      .eq("item_id", item.id)
      .eq("user_id", user.id);

    // 1. しんみりリアクション追加 (INSERT)
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
    console.log("✅ Step 1: Shinmiri reaction ADDED successfully.");

    // 2. 件数取得の確認
    const { count: countAfterAdd } = await supabase
      .from("shinmiri_reactions")
      .select("id", { count: "exact", head: true })
      .eq("item_id", item.id);

    console.log(`   Reaction count after add: ${countAfterAdd}`);

    // 3. 重複防止の検証 (同一ユーザーによる重複INSERTがUNIQUE制約で弾かれるか)
    const { error: duplicateError } = await supabase
      .from("shinmiri_reactions")
      .insert({
        item_id: item.id,
        user_id: user.id,
      });

    if (duplicateError) {
      console.log("✅ Step 2: Duplicate reaction prevented by UNIQUE constraint.");
    } else {
      console.error("❌ Duplicate reaction was NOT prevented!");
      process.exitCode = 1;
    }

    // 4. しんみりリアクション解除 (DELETE)
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
    console.log("✅ Step 3: Shinmiri reaction REMOVED successfully.");

    // 5. 解除後の件数確認
    const { count: countAfterDelete } = await supabase
      .from("shinmiri_reactions")
      .select("id", { count: "exact", head: true })
      .eq("item_id", item.id);

    console.log(`   Reaction count after remove: ${countAfterDelete}`);
  } finally {
    // クリーンアップ
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
