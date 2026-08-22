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

async function testExhibitRegistration() {
  console.log("🧪 Starting Exhibit Registration Test...\n");

  const testEmail = `tester_${Date.now()}@anokoro.local`;
  const testPassword = "password123!";

  const { data: authData, error: authError } = await supabase.auth.signUp({
    email: testEmail,
    password: testPassword,
  });

  if (authError || !authData.user || !authData.session) {
    console.error("❌ Authentication failed:", authError?.message ?? "Session not created");
    return;
  }
  console.log(`✅ Authenticated! User ID: ${authData.user.id}\n`);

  const userId = authData.user.id;

  const mockItem = {
    title: "たまごっち (テスト登録)",
    description: "お腹がすいたらピピッとお知らせ。授業中に鳴らないかヒヤヒヤしながら育てていました。",
    category: "ゲーム",
    year: 1996,
    imageFileName: "youkai-watch.png",
  };

  const imagesDir = path.join(process.cwd(), "public/mock-images");
  const imagePath = path.join(imagesDir, mockItem.imageFileName);

  if (!fs.existsSync(imagePath)) {
    console.error("❌ Image file not found:", imagePath);
    return;
  }

  const fileBuffer = fs.readFileSync(imagePath);
  const ext = mockItem.imageFileName.split(".").pop() || "png";
  const contentType = ext === "png" ? "image/png" : ext === "webp" ? "image/webp" : "image/jpeg";
  const fileName = `${userId}/${Date.now()}_test_${crypto.randomUUID()}.${ext}`;

  const { data: uploadData, error: uploadError } = await supabase.storage
    .from("exhibits")
    .upload(fileName, fileBuffer, {
      contentType,
      upsert: false,
    });

  if (uploadError || !uploadData) {
    console.error("❌ Storage upload failed:", uploadError?.message);
    return;
  }

  const { data: publicData } = supabase.storage.from("exhibits").getPublicUrl(uploadData.path);
  const imageUrl = publicData.publicUrl;
  console.log(`✅ Storage upload succeeded! Public URL: ${imageUrl}\n`);

  const { data: newItem, error: insertError } = await supabase
    .from("items")
    .insert({
      user_id: userId,
      title: mockItem.title,
      description: mockItem.description,
      category: mockItem.category,
      year: mockItem.year,
      image_url: imageUrl,
    })
    .select("id, title, category, year, image_url, created_at")
    .single();

  if (insertError || !newItem) {
    console.error("❌ DB insert failed:", insertError?.message);
    return;
  }

  console.log(`✅ DB insert succeeded!`);
  console.log(`   ID: ${newItem.id}`);
  console.log(`   Title: ${newItem.title}`);
  console.log(`   Category: ${newItem.category} / Year: ${newItem.year}`);
  console.log(`   Image URL: ${newItem.image_url}`);
  console.log(`   Created At: ${newItem.created_at}\n`);

  // テスト用レコードをクリーンアップ
  await supabase.from("items").delete().eq("id", newItem.id);
  console.log("🧹 Test item cleaned up.");

  console.log("🎉 Exhibit Registration Test Complete!");
}

testExhibitRegistration();
