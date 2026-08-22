import { createClient } from "@supabase/supabase-js";
import fs from "fs";
import path from "path";

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

async function testFormFlow() {
  console.log("🧪 Testing Form Submission & Server Action Logic...\n");

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

  console.log(`✅ Authenticated user: ${user.id}\n`);

  const imagePath = path.join(process.cwd(), "public/mock-images/youkai-watch.png");
  const fileBuffer = fs.readFileSync(imagePath);
  const ext = "png";
  const fileName = `${user.id}/${Date.now()}_form_test_${crypto.randomUUID()}.${ext}`;

  let uploadedPath: string | null = null;
  let insertedId: string | null = null;

  try {
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from("exhibits")
      .upload(fileName, fileBuffer, {
        contentType: "image/png",
        upsert: false,
      });

    if (uploadError || !uploadData) {
      console.error("❌ Upload error:", uploadError?.message);
      process.exitCode = 1;
      return;
    }

    uploadedPath = uploadData.path;
    const { data: publicData } = supabase.storage.from("exhibits").getPublicUrl(uploadedPath);

    const { data: newItem, error: insertError } = await supabase
      .from("items")
      .insert({
        user_id: user.id,
        title: "フォーム連携テスト展示",
        description: "展示品UIとバックエンドの接続テストデータです。",
        category: "ゲーム",
        year: 2013,
        image_url: publicData.publicUrl,
      })
      .select("id, title, category, year, image_url, created_at")
      .single();

    if (insertError || !newItem) {
      console.error("❌ Insert error:", insertError?.message);
      process.exitCode = 1;
      return;
    }

    insertedId = newItem.id;
    console.log("✅ Form submission simulation SUCCESS:");
    console.log(`   ID: ${newItem.id}`);
    console.log(`   Title: ${newItem.title}`);
    console.log(`   Image URL: ${newItem.image_url}\n`);
  } finally {
    let dbCleanupFailed = false;

    if (insertedId) {
      const { error: deleteDbError } = await supabase.from("items").delete().eq("id", insertedId);
      if (deleteDbError) {
        console.error("⚠️ Failed to clean up test DB row:", deleteDbError.message);
        dbCleanupFailed = true;
        process.exitCode = 1;
      } else {
        console.log("🧹 Cleaned up test DB row.");
      }
    }

    if (uploadedPath && !dbCleanupFailed) {
      const { error: deleteStorageError } = await supabase.storage.from("exhibits").remove([uploadedPath]);
      if (deleteStorageError) {
        console.error("⚠️ Failed to clean up test storage object:", deleteStorageError.message);
        process.exitCode = 1;
      } else {
        console.log("🧹 Cleaned up test storage object.");
      }
    } else if (uploadedPath && dbCleanupFailed) {
      console.warn("⚠️ Preserving test storage object due to DB cleanup error. Path:", uploadedPath);
    }
  }

  if (process.exitCode === 1) {
    console.error("\n⚠️ Test finished with errors.");
  } else {
    console.log("\n🎉 Form & Backend Connection Test Passed!");
  }
}

testFormFlow();
