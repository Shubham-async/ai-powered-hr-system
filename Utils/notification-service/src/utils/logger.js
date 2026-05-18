import chalk from "chalk"; // for colored output
import dayjs from "dayjs"; // for timestamps

/**
 * Simple structured logger utility
 * Usage: logger.info("message"), logger.error("message"), etc.
 */

const logger = {
    info: (msg) =>
        console.log(`${chalk.blue("[INFO]")} ${dayjs().format("HH:mm:ss")} - ${msg}`),

    success: (msg) =>
        console.log(`${chalk.green("[SUCCESS]")} ${dayjs().format("HH:mm:ss")} - ${msg}`),

    warn: (msg) =>
        console.log(`${chalk.yellow("[WARN]")} ${dayjs().format("HH:mm:ss")} - ${msg}`),

    error: (msg) =>
        console.error(`${chalk.red("[ERROR]")} ${dayjs().format("HH:mm:ss")} - ${msg}`),
};

export default logger;
