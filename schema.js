import { model, Schema } from 'mongoose';

const urlSchema = new Schema({
    original_url: { type: String, required: true },
    short_url: { type: String, required: true },
    generated_id: { type: String, required: true }
}, { timestamps: true });

const UrlSchema = model('UrlSchema', urlSchema);
export default UrlSchema;