const crypto = require("node:crypto");

async function petTask({ userName }) {
  const timestamp = new Date().toLocaleTimeString();

  // Generate random number using Node.js built-in crypto module
  const cryptoRandomNum = crypto.randomInt(10000, 99999);

  console.log(
    `[${timestamp}] [Node.js PetTask] Start Sleep - User: "${userName}" | Crypto Random: ${cryptoRandomNum}`,
  );

  try {
    // 2-second async sleep in Node.js
    await new Promise((resolve) => setTimeout(resolve, 2000));

    // 50% random failure rate
    const isFailure = Math.random() < 0.5;
    if (isFailure) {
      throw new Error(
        `Petting task failed for ${userName}: Avatar was grumpy!`,
      );
    }

    console.log(
      `[${timestamp}] [Node.js PetTask] End Sleep - Success! User: "${userName}" | Crypto Random: ${cryptoRandomNum}`,
    );

    return {
      success: true,
      cryptoRandom: cryptoRandomNum,
      message: `Avatar was petted happily!`,
    };
  } catch (err) {
    console.error(
      `[${timestamp}] [Node.js PetTask] Error sleep - User: "${userName}" | Crypto Random: ${cryptoRandomNum} | Error: ${err.message}`,
    );

    return {
      success: false,
      cryptoRandom: cryptoRandomNum,
      error: err.message,
    };
  }
}

module.exports = { petTask };
