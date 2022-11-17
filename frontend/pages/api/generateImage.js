const { Configuration, OpenAIApi } = require("openai");
const configuration = new Configuration({
  apiKey: process.env.DALLE_SK,
});
const openai = new OpenAIApi(configuration);


export default async function handler(req, res) {

    if(req.method === 'POST') {
        const prompt = req.body.prompt
        const user = req.body.user
        const response = await openai.createImage({
            prompt: prompt,
            n: 1,
            size: "1024x1024",
            user: user, 
        });
        
        console.log(response.data.data[0]["url"])
        res.status(200)
        res.send({
            "image_url": response.data.data[0]["url"]
        })
    }

} 