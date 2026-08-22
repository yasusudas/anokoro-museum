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

async function testDuplicateTitleFlow() {
  console.log("🧪 Starting Duplicate Title Check Test...\n");

  const testEmail = process.env.TEST_USER_EMAIL || "test_runner@anokoro.local";
  const testPassword = process.env.TEST_USER_PASSWORD || "TestRunnerPassword123!";

  const signInResult = await supabase.auth.signInWithPassword({
    email: testEmail,
    password: testPassword,
  });

  let user = signInResult.data.user;

  if (!user) {
    const signUpResult = await supabase.auth.signUp({
      email: testEmail,
      password: testPassword,
    });
    user = signUpResult.data.user;
  }

  if (!user) {
    console.error("❌ Authentication failed");
    process.exitCode = 1;
    return;
  }

  console.log(`✅ Authenticated user: ${user.id}`);

  // 1. 既存の展示アイテムを1件取得
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

  console.log(`📌 Existing Exhibit in DB: "${existingItem.title}" (${existingItem.id})\n`);

  // 2. 同一タイトルでの重複チェッククエリを検証
  const { data: duplicateMatch, error: checkError } = await supabase
    .from("items")
    .select("id")
    .eq("title", existingItem.title)
    .limit(1)
    .maybeSingle();

  if (checkError) {
    console.error("❌ Duplicate check query failed:", checkError.message);
    process.exitCode = 1;
    return;
  }

  if (duplicateMatch && duplicateMatch.id === existingItem.id) {
    console.log(`✅ Duplicate title detected correctly: "${existingItem.title}"`);
    console.log('   Expected Error: "その展示品は寄贈されています"');
  } else {
    console.error("❌ Failed to detect duplicate title!");
    process.exitCode = 1;
  }

  // 3. 存在しないタイトルの場合は検出されないことを検証
  const uniqueTitle = `まったく新しい寄贈品_${Date.now()}`;
  const { data: nonDuplicateMatch } = await supabase
    .from("items")
    .select("id")
    .eq("title", uniqueTitle)
    .limit(1)
    .maybeSingle();

  if (!nonDuplicateMatch) {
    console.log(`✅ Non-duplicate title passed check: "${uniqueTitle}"`);
  } else {
    console.error("❌ False positive on non-duplicate title!");
    process.exitCode = 1;
  }

  if (process.exitCode === 1) {
    console.error("\n⚠️ Test finished with errors.");
  } else {
    console.log("\n🎉 Duplicate Title Validation Logic Test Passed!");
  }
}

testDuplicateTitleFlow();
