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
    id: "11111111-1111-4111-8111-111111111111",
    user_id: dummyUserId,
    title: "ひもQ",
    description: "遠足の日、ちぎれないように端から大事に食べた、あの長いグミ。友だちと長さを比べるのも定番でした。",
    category: "おかし",
    year: 2004,
    image_url: "https://images.unsplash.com/photo-1582058091505-f87a2e55a40f?w=600&auto=format&fit=crop&q=80",
    created_at: "2026-08-01T00:00:00+09:00",
  },
  {
    id: "22222222-2222-4222-8222-222222222222",
    user_id: dummyUserId,
    title: "妖怪ウォッチ",
    description: "放課後になると、みんなで妖怪メダルを見せ合った。あの召喚ソングは今でも口ずさめるかも。",
    category: "ゲーム",
    year: 2013,
    image_url: "https://images.unsplash.com/photo-1511512578047-dfb367046420?w=600&auto=format&fit=crop&q=80",
    created_at: "2026-08-01T01:00:00+09:00",
  },
  {
    id: "33333333-3333-4333-8333-333333333333",
    user_id: dummyUserId,
    title: "タピオカ",
    description: "長い列に並んで、黒糖ミルクを片手に写真を撮った放課後。太いストローも含めて思い出。",
    category: "たべもの",
    year: 2018,
    image_url: "https://images.unsplash.com/photo-1541658016709-82535e94bc69?w=600&auto=format&fit=crop&q=80",
    created_at: "2026-08-01T02:00:00+09:00",
  },
  {
    id: "44444444-4444-4444-8444-444444444444",
    user_id: dummyUserId,
    title: "かいけつゾロリ",
    description: "休み時間の図書室。貸出中なら次の巻を探して、最後のなぞなぞまでしっかり読んだ。",
    category: "ほん",
    year: 2000,
    image_url: "https://images.unsplash.com/photo-1512820790803-83ca734da794?w=600&auto=format&fit=crop&q=80",
    created_at: "2026-08-01T03:00:00+09:00",
  },
  {
    id: "55555555-5555-4555-8555-555555555555",
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
    title: "おいでよ どうぶつの森",
    description: "DSを持ち寄って、友達の村に遊びに行ったりカブを売買したりして通信プレイに夢中になりました。",
    category: "ゲーム",
    year: 2005,
    image_url: "https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=600&auto=format&fit=crop&q=80",
    created_at: "2026-08-21T07:07:46.552256+00:00",
  },
  {
    id: "5a802a54-d1eb-490d-a167-53714978ffeb",
    user_id: dummyUserId,
    title: "ニンテンドー3DS",
    description: "裸眼立体視の3D映像やすれちがい通信にワクワクした。すれちがいMii広場のピース集めも夢中でした。",
    category: "ガジェット",
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
