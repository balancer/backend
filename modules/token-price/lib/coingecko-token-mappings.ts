export const coinGeckoTokenMappings: {
    Prices: {
        CustomPlatformId: { [address: string]: string };
        ChainMap: { [chainId: string]: { [address: string]: string } };
    };
} = {
    Prices: {
        CustomPlatformId: {
            '0x514910771af9ca656af840dff83e8264ecf986ca': 'ethereum',
            '0x6b175474e89094c44da98b954eedeac495271d0f': 'ethereum',
            '0xdac17f958d2ee523a2206206994597c13d831ec7': 'ethereum',
            '0x99d8a9c45b2eca8864373a26d1459e3dff1e17f3': 'ethereum',
        },
        ChainMap: {
            '4': {
                '0xb4761d0481b4f7a8a858d2796eef3daa2f3d9d2c': '0x321162cd933e2be498cd2267a90534a804051b11',
                '0x70b55af71b29c5ca7e67bd1995250364c4be5554': '0x04068da6c83afcfa0e13ba15a6696662335d5b75',
                '0x80dd2b80fbcfb06505a301d732322e987380ecd6': '0x74b23882a30290451a17c44f4f05243b6b58c76d',
                '0xb8fecb889862c486bcce52222c7efe9b30371ad5': '0x514910771af9ca656af840dff83e8264ecf986ca',
                '0x12c615406f20edcbda50888f9fd6734dc4836417': '0x6b175474e89094c44da98b954eedeac495271d0f',
                '0x6f00d64b42af8f449db15b0b3ee3b444550c4826': '0x5cc61a78f164885776aa610fb0fe1257df78e59b',
                '0x4176603b0712407b1d7dcce3acab685f7219e6dd': '0x841fad6eae12c286d1fd18d1d525dffa75c7effe',
                '0x0d543d9528e17cf55ac73660407f712b5a3085ab': '0xe0654c8e6fd4d733349ac7e09f6f23da256bf475',
                '0xda05941b0a17a1b537c711094c575665c116d237': '0xc5e2b037d30a390e62180970b3aa4e91868764cd',
                '0x64fe8666ccbd87e819a398eeb79580255d00d8ea': '0x05848b832e872d9edd84ac5718d58f21fd9c9649',
                '0x6a9598780f937c10fffccb9dbf9a792d122cc538': '0x10b620b2dbac4faa7d7ffd71da486f5d44cd86f9',
                '0xcabdf4994c71e48d8e8af66457658fc7cd29400f': '0xf16e81dce15b08f326220742020379b855b87df9',
                '0x0483863540cb2c1ea77f7827db43ee160a0ad7ac': '0x21be370d5312f44cb42ce377bc9b8a0cef1a4c83',
                '0x40d26f06defee453bcfcaa61badb16883e4ee26c': '0xdac17f958d2ee523a2206206994597c13d831ec7',
            },
            '250': {
                '0x8d11ec38a3eb5e956b052f67da8bdc9bef8abf3e': '0x6b175474e89094c44da98b954eedeac495271d0f',
                '0xb3654dc3d10ea7645f8319668e8f54d2574fbdc8': '0x514910771af9ca656af840dff83e8264ecf986ca',
                '0x82f0b8b456c1a451378467398982d4834b6829c1': '0x99d8a9c45b2eca8864373a26d1459e3dff1e17f3',
                '0x049d68029688eabf473097a2fc38ef61633a3c7a': '0xdac17f958d2ee523a2206206994597c13d831ec7',
            },
        },
    },
};
