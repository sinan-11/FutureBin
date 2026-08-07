import { MongoClient } from "mongodb";
const url = "mongodb+srv://admin:admin123@cluster0.cw1uvfd.mongodb.net/futurebin";
const client = new MongoClient(url, { serverSelectionTimeoutMS: 15000 });
try {
  await client.connect();
  const db = client.db();
  const u = db.collection("users");
  const c = db.collection("chatmessages");
  const p = db.collection("pickuprequests");
  const users = await u.find({}).project({ _id:1, name:1, email:1, role:1, emailVerified:1, isApproved:1 }).limit(10).toArray();
  console.log("USERS:", JSON.stringify(users, null, 1));
  console.log("chatmessages count:", await c.countDocuments());
  console.log("pickuprequests count:", await p.countDocuments());
} catch (e) { console.error("DB ERROR:", e.message); }
finally { await client.close(); }
