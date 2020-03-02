module.exports = {
    "transform": {
        "^.+\\.ts?$": "ts-jest"
    },
    "testRegex": "(.*|(\\.|/)(test|spec))\\.ts?$",
    "moduleFileExtensions": [
        "ts",
        "tsx",
        "js",
        "jsx",
        "json",
        "node"
    ],
    "preset": "jest-puppeteer"
}
