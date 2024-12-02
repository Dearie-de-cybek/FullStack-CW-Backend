var express = require("express");
let app = express();
const cors = require("cors");
app.use(cors());
app.use(express.json());
app.set("json spaces", 3);
const path = require("path");


let PropertiesReader = require("properties-reader");

let propertiesPath = path.resolve(__dirname, "db.properties");
let properties = PropertiesReader(propertiesPath);

let dbPprefix = properties.get("db.prefix");

let dbUsername = encodeURIComponent(properties.get("db.user"));
let dbPwd = encodeURIComponent(properties.get("db.pwd"));
let dbName = properties.get("db.dbName");
let dbUrl = properties.get("db.dbUrl");
let dbParams = properties.get("db.params");

const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");

const uri = dbPprefix + dbUsername + ":" + dbPwd + dbUrl + dbParams;

const client = new MongoClient(uri, { serverApi: ServerApiVersion.v1 });

let db1;

async function connectDB() {
  try {
    client.connect();
    console.log("Connected to MongoDB");
    db1 = client.db("FullStack");
  } catch (err) {
    console.error("MongoDB connection error:", err);
  }
}

connectDB();

app.use("/images", express.static(path.join(__dirname, "images")));

app.get("/images/:imageName", (req, res) => {
  const imagePath = path.join(__dirname, "images", req.params.imageName);

  
  res.sendFile(imagePath, (err) => {
    if (err) {
      console.error("Image not found:", err);
      return res.status(404).json({ error: "Image not found" });
    }
  });
});

app.param("collectionName", async function (req, res, next, collectionName) {
  req.collection = db1.collection(collectionName);

  console.log("Middleware set collection:", req.collection.collectionName);
  next();
});

app.get("/collections/:collectionName", async function (req, res) {
  try {
    const data = await req.collection.find().toArray();
    const lessonsWithImageURLs = data.map(lesson => {
        return {
          ...lesson,
          image: `${lesson.image}` 
        };
      });
      res.status(200).json(lessonsWithImageURLs);
  } catch (err) {
    console.error("Error fetching data:", err);
    res.status(500).json({ error: "Unable to fetch data" });
  }
});

app.post("/collections/:collectionName", async function (req, res) {
  try {
    const result = await req.collection.insertOne(req.body);
    res
      .status(201)
      .json({ message: "Document added", insertedId: result.insertedId });
  } catch (err) {
    console.error("Error inserting document:", err);
    res.status(500).json({ error: "Unable to insert document" });
  }
});

app.put("/collections/:collectionName/:id", async function (req, res) {
  try {
    const id = new ObjectId(req.params.id);
    const updateResult = await req.collection.updateOne(
      { _id: id },
      { $set: req.body }
    );
    if (updateResult.matchedCount === 0) {
      return res.status(404).json({ error: "Document not found" });
    }
    res.json({
      message: "Document updated",
      modifiedCount: updateResult.modifiedCount,
    });
  } catch (err) {
    console.error("Error updating document:", err);
    res.status(500).json({ error: "Unable to update document" });
  }
});

app.delete("/collections/:collectionName/:id", async function (req, res) {
  try {
    const id = new ObjectId(req.params.id);
    const deleteResult = await req.collection.deleteOne({ _id: id });
    if (deleteResult.deletedCount === 0) {
      return res.status(404).json({ error: "Document not found" });
    }
    res.json({ message: "Document deleted" });
  } catch (err) {
    console.error("Error deleting document:", err);
    res.status(500).json({ error: "Unable to delete document" });
  }
});

app.get("/collections/:collectionName/:id", async function (req, res) {
  try {
    const id = new ObjectId(req.params.id);
    const document = await req.collection.findOne({ _id: id });
    if (!document) {
      return res.status(404).json({ error: "Document not found" });
    }
    res.json(document);
  } catch (err) {
    console.error("Error fetching document:", err);
    res.status(500).json({ error: "Unable to fetch document" });
  }
});


app.use((err, req, res, next) => {
  console.error("Global error handler:", err);
  res.status(500).json({ error: "An error occurred" });
});

app.listen(3000, () => {
  console.log("Server is running on port 3000");
});
