import validUrl from 'valid-url';
import express from 'express';
import mongoose from 'mongoose';
import 'dotenv/config';

const app = express();
const { model, Schema } = mongoose;
const port = 3000;

app.use(express.json());

const dbUrl = process.env.URLSHORTENER_DATABASE_URL

// mongodb connection
mongoose.connect( dbUrl, { 
    useUnifiedTopology: true, 
    useNewUrlParser: true, 
})
.then( async () => {
    console.log('Connected to mongodb');
})

// mongoose schema
const urlSchema = new Schema({
    original_url: { type: String, required: true },
    short_url: { type: String, required: true },
    generated_id: { type: String, required: true }
}, { timestamps: true });

const UrlSchema = model('UrlSchema', urlSchema);

// to generate a unique string
const generateUniqueId = async() => {
  const generatedId = Math.random().toString(32).substr(2, 8);
  const existingId = await UrlSchema.findOne({generated_id:generatedId});
  if(existingId){
    return generateUniqueId();
  }else{
    return generatedId;
  }
}

// checks if the url inputted is a valid url
const checkIfUrlIsValid = (req, res, next) => {
    const { url } = req.body;
    if (validUrl.isUri(url)) {
      next();
    } else {
      res.send(400);
    }
};

// checks if the url already exists
const checkIfUrlExists = async (req, res, next) => {
    const findOriginalUrl = await UrlSchema.findOne({original_url:req.body.url});
    if (findOriginalUrl) {
        return res.status(200).json({ shortUrl: findOriginalUrl.short_url });
    }
    next();
};

// shortens the url
const createShortUrl = async (req, res) => {
    try {
      const id = await generateUniqueId();
      const shortUrl = `http://localhost:${port}/${id}`;
      const newUrl = new UrlSchema({ original_url: req.body.url, short_url: shortUrl, generated_id: id });
      await newUrl.save();
      return res.status(201).json({
        shortUrl,
      });
    } catch (error) {
      console.log(error);
      res.status(500);
    }
};
// fetches the url from the db
const findUrl = async (req, res) => {
    const { urlId } = req.params;
    const returnedUrl = await UrlSchema.findOne({generated_id:urlId});
    return returnedUrl
      ? res.redirect(returnedUrl.original_url)
      : res.status(404);
};

app.post("/shorten", checkIfUrlIsValid, checkIfUrlExists, createShortUrl);
app.get("/:urlId", findUrl);

app.listen(port, () => console.log(`Listening on port ${port}`));
