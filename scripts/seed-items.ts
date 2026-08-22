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

const dummyUserId = "11111111-1111-1111-1111-111111111111";

const exhibits = [
  {
    id: "abccab1c-030a-46ca-a77e-403558a7b4e3",
    user_id: dummyUserId,
    title: "ひもQ",
    description: "遠足の日、ちぎれないように端から大事に食べた、あの長いグミ。友だちと長さを比べるのも定番でした。",
    category: "おかし",
    year: 2004,
    image_url: "/mock-images/himo-q.jpg",
    created_at: "2026-08-01T00:00:00+09:00",
  },
  {
    id: "96d0cc6b-ef33-4d69-b5f0-8e5371ab3c29",
    user_id: dummyUserId,
    title: "妖怪ウォッチ",
    description: "放課後になると、みんなで妖怪メダルを見せ合った。あの召喚ソングは今でも口ずさめるかも。",
    category: "ゲーム",
    year: 2013,
    image_url: "https://images.unsplash.com/photo-1511512578047-dfb367046420?w=600&auto=format&fit=crop&q=80",
    created_at: "2026-08-01T01:00:00+09:00",
  },
  {
    id: "01b2a5ce-d7f5-48a5-83be-c02acbe44673",
    user_id: dummyUserId,
    title: "タピオカ",
    description: "長い列に並んで、黒糖ミルクを片手に写真を撮った放課後。太いストローも含めて思い出。",
    category: "たべもの",
    year: 2018,
    image_url: "https://images.unsplash.com/photo-1541658016709-82535e94bc69?w=600&auto=format&fit=crop&q=80",
    created_at: "2026-08-01T02:00:00+09:00",
  },
  {
    id: "f5336f5e-34f3-4dad-b26a-516a70e92e1f",
    user_id: dummyUserId,
    title: "かいけつゾロリ",
    description: "休み時間の図書室。貸出中なら次の巻を探して、最後のなぞなぞまでしっかり読んだ。",
    category: "ほん",
    year: 2000,
    image_url: "/mock-images/zorori.jpg",
    created_at: "2026-08-01T03:00:00+09:00",
  },
  {
    id: "5fbf3448-5776-4765-8676-8a7a7ca7531f",
    user_id: dummyUserId,
    title: "ソーラン節",
    description: "運動会前、筋肉痛になるまで低い姿勢を練習した。クラス全員の掛け声が揃った瞬間は忘れられない。",
    category: "できごと",
    year: 2005,
    image_url: "https://images.unsplash.com/photo-1533105079780-92b9be482077?w=600&auto=format&fit=crop&q=80",
    created_at: "2026-08-01T04:00:00+09:00",
  },
  {
    id: "052dd450-347a-4166-8b4c-da075e9a796d",
    user_id: dummyUserId,
    title: "あつまれ どうぶつの森",
    description: "無人島でのDIY生活や、オンラインで友達の島に遊びに行くのがおうち時間の定番でした。",
    category: "ゲーム",
    year: 2020,
    image_url: "https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=600&auto=format&fit=crop&q=80",
    created_at: "2026-08-21T07:07:46.552256+00:00",
  },
  {
    id: "5a802a54-d1eb-490d-a167-53714978ffeb",
    user_id: dummyUserId,
    title: "ニンテンドー3DS",
    description: "裸眼立体視の3D映像やすれちがい通信にワクワクした。すれちがいMii広場のピース集めも夢中でした。",
    category: "ゲーム",
    year: 2011,
    image_url: "https://images.unsplash.com/photo-1592840496694-26d035b52b48?w=600&auto=format&fit=crop&q=80",
    created_at: "2026-08-21T07:07:46.552256+00:00",
  },
  {
    id: "3bf75231-81b2-4701-a1f5-2a28ec4918b5",
    user_id: dummyUserId,
    title: "ガラケー",
    description: "メアド交換は赤外線通信！携帯をピタッとくっつけて受信して、キラキラのデコメで返信するのが定番でした。",
    category: "ガジェット",
    year: 2007,
    image_url: "https://images.unsplash.com/photo-1520923642038-b4259acecbd7?w=600&auto=format&fit=crop&q=80",
    created_at: "2026-08-21T07:07:46.552256+00:00",
  },
];

async function run() {
  console.log("Seeding exhibits with image URLs to Supabase DB...");
  for (const exhibit of exhibits) {
    const { error } = await supabase
      .from("items")
      .upsert(exhibit, { onConflict: "id" });

    if (error) {
      console.error(`Error updating ${exhibit.title}:`, error);
    } else {
      console.log(`✓ Updated image_url for: ${exhibit.title}`);
    }
  }

  const { data: allItems } = await supabase
    .from("items")
    .select("id, title, category, year, image_url")
    .order("created_at", { ascending: true });

  console.log(`\n🎉 Total items in DB: ${allItems?.length}`);
  console.table(allItems);
}

run();
