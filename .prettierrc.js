module.exports = {
    plugins: ["prettier-plugin-solidity"],
    overrides: [
        {
            files: "*.sol",
            options: {
                parser: "solidity-parse",
                printWidth: 80,
                tabWidth: 4,
                useTabs: false,
                singleQuote: false,
                bracketSpacing: false,
                explicitTypes: "preserve",
            },
        },
    ],
    trailingComma: "es5",
    tabWidth: 2,
    printWidth: 100,
    singleQuote: false,
    semi: true,
    bracketSpacing: true,
};
