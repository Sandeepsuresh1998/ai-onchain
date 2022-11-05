const { Configuration, OpenAIApi } = require("openai");

export default async function handler(req, res) {

  // const configuration = new Configuration({
  //     apiKey: process.env.DALLE_SK,
  // });
  // const openai = new OpenAIApi(configuration);

  // const response = await openai.createImage({
  //   prompt:"Pikachu holding a lightning bolt",
  //   n: 1,
  //   size: "1024x1024",
  // });

  // const image_url = response.data.data[0].url;
  // res.status(200).json({ name: image_url});

}