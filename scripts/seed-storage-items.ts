import { createClient } from "@supabase/supabase-js";
import fs from "fs";
import path from "path";

// .env.local の環境変数をロード
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

const dummyUserId = "11111111-1111-1111-1111-111111111111";

// 登録したいモックデータのリスト
// public/mock-images/ に画像を置き、imageFileName にそのファイル名を指定します
const mockExhibits = [
  {
    id: "11111111-1111-4111-8111-111111111111",
    user_id: dummyUserId,
    title: "ひもQ",
    description: "遠足の日、ちぎれないように端から大事に食べた、あの長いグミ。友だちと長さを比べるのも定番でした。",
    category: "おかし",
    year: 2004,
    imageFileName: "himo-q.jpg",
    created_at: "2026-08-01T00:00:00+09:00",
  },
  {
    id: "22222222-2222-4222-8222-222222222222",
    user_id: dummyUserId,
    title: "妖怪ウォッチ",
    description: "放課後になると、みんなで妖怪メダルを見せ合った。あの召喚ソングは今でも口ずさめるかも。",
    category: "ゲーム",
    year: 2013,
    imageFileName: "youkai-watch.png",
    created_at: "2026-08-01T01:00:00+09:00",
  },
  {
    id: "33333333-3333-4333-8333-333333333333",
    user_id: dummyUserId,
    title: "タピオカ",
    description: "長い列に並んで、黒糖ミルクを片手に写真を撮った放課後。太いストローも含めて思い出。",
    category: "たべもの",
    year: 2018,
    imageFileName: "tapioka.jpg",
    created_at: "2026-08-01T02:00:00+09:00",
  },
  {
    id: "44444444-4444-4444-8444-444444444444",
    user_id: dummyUserId,
    title: "かいけつゾロリ",
    description: "休み時間の図書室。貸出中なら次の巻を探して、最後のなぞなぞまでしっかり読んだ。",
    category: "ほん",
    year: 2000,
    imageFileName: "zorori.jpg",
    created_at: "2026-08-01T03:00:00+09:00",
  },
  {
    id: "55555555-5555-4555-8555-555555555555",
    user_id: dummyUserId,
    title: "ソーラン節",
    description: "運動会前、筋肉痛になるまで低い姿勢を練習した。クラス全員の掛け声が揃った瞬間は忘れられない。",
    category: "できごと",
    year: 2005,
    imageFileName: "soran-bushi.png",
    created_at: "2026-08-01T04:00:00+09:00",
  },
  {
    id: "052dd450-347a-4166-8b4c-da075e9a796d",
    user_id: dummyUserId,
    title: "あつまれ どうぶつの森",
    description: "無人島でのDIY生活や、オンラインで友達の島に遊びに行くのがおうち時間の定番でした。",
    category: "ゲーム",
    year: 2020,
    imageFileName: "doubutsu-no-mori.jpg",
    created_at: "2026-08-21T07:07:46.552256+00:00",
  },
  {
    id: "5a802a54-d1eb-490d-a167-53714978ffeb",
    user_id: dummyUserId,
    title: "ニンテンドー3DS",
    description: "裸眼立体視の3D映像やすれちがい通信にワクワクした。すれちがいMii広場のピース集めも夢中でした。",
    category: "ガジェット",
    year: 2011,
    imageFileName: "ds-lite.jpg",
    created_at: "2026-08-21T07:07:46.552256+00:00",
  },
  {
    id: "3bf75231-81b2-4701-a1f5-2a28ec4918b5",
    user_id: dummyUserId,
    title: "ガラケー",
    description: "メアド交換は赤外線通信！携帯をピタッとくっつけて受信して、キラキラのデコメで返信するのが定番でした。",
    category: "ガジェット",
    year: 2007,
    imageFileName: "garakei.jpg",
    created_at: "2026-08-21T07:07:46.552256+00:00",
  },
];

async function seedStorageItems() {
  console.log("🚀 Starting Supabase Storage Upload & DB Seeding...\n");

  // 認証用テストユーザーの作成/ログイン
  const testEmail = `seed_uploader_${Date.now()}@anokoro.local`;
  const testPassword = "password123!";

  const { data: authData, error: authError } = await supabase.auth.signUp({
    email: testEmail,
    password: testPassword,
  });

  if (authError || !authData.user) {
    console.error("❌ Authentication error:", authError?.message);
    return;
  }

  const userId = authData.user.id;
  console.log(`✅ Authenticated as seed uploader (UID: ${userId})\n`);

  const imagesDir = path.join(process.cwd(), "public/mock-images");

  for (const item of mockExhibits) {
    let imageUrl: string | null = null;

    if (item.imageFileName) {
      const localFilePath = path.join(imagesDir, item.imageFileName);

      if (fs.existsSync(localFilePath)) {
        const fileBuffer = fs.readFileSync(localFilePath);
        const ext = item.imageFileName.split(".").pop() || "jpg";
        const storagePath = `${userId}/mock_${item.id}.${ext}`;
        const contentType = ext === "png" ? "image/png" : ext === "webp" ? "image/webp" : "image/jpeg";

        // Supabase Storage にアップロード
        const { error: uploadError } = await supabase.storage
          .from("exhibits")
          .upload(storagePath, fileBuffer, {
            contentType,
            upsert: true,
          });

        if (uploadError) {
          console.error(`⚠️ Failed to upload image for ${item.title}:`, uploadError.message);
        } else {
          // 公開URLを取得
          const { data: publicData } = supabase.storage
            .from("exhibits")
            .getPublicUrl(storagePath);

          imageUrl = publicData.publicUrl;
          console.log(`📁 Uploaded to Storage: ${item.title} -> ${imageUrl}`);
        }
      } else {
        console.warn(`⚠️ Local file not found: ${localFilePath}`);
      }
    }

    // items テーブルに保存
    const { error: dbError } = await supabase.from("items").upsert(
      {
        id: item.id,
        user_id: item.user_id,
        title: item.title,
        description: item.description,
        category: item.category,
        year: item.year,
        image_url: imageUrl,
        created_at: item.created_at,
      },
      { onConflict: "id" }
    );

    if (dbError) {
      console.error(`❌ DB Upsert Error for ${item.title}:`, dbError.message);
    } else {
      console.log(`✅ DB Saved: ${item.title}`);
    }
  }

  // 最新のDBアイテム一覧を表示
  const { data: allItems } = await supabase
    .from("items")
    .select("id, title, category, year, image_url")
    .order("created_at", { ascending: true });

  console.log(`\n🎉 Seeding Complete! Total items in DB: ${allItems?.length}\n`);
  console.table(allItems);
}

seedStorageItems();
