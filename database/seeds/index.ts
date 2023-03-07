import mongoose, { model, Schema } from 'mongoose';
import { countryData } from './country';
import { userData } from './user';
import env from 'dotenv';

(async () => {
    env.config();
    await mongoose.connect(process.env.MONGO_DATABSE_CONNECTION_STRING);
    const seedSchema = new Schema({}, { strict: false });
    const countryCollection = model(countryData.collectionName, seedSchema);
    await countryCollection.insertMany(countryData.data);
    const country = await countryCollection.findOne({ code: 'fr' });
    userData.data = userData.data.map((user) => {
        return {
            ...user,
            countryId: country._id,
        };
    });

    const collection = model(userData.collectionName, seedSchema);
    await collection.insertMany(userData.data);
    console.log(`Seed data done for ${userData.collectionName}`);

    process.exit();
})();
