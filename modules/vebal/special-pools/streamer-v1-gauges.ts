/*
  The old L2 V1 gauges were using streamer field (instead of recipient) to match the root gauge with a child gauge.
  We are not storing the deprecated streamer field in the PrismaPoolStakingGauge but using this hardcoded mapping instead.

  This cases apply for old v1 killed but active gauges (gauge_relative_weight > 0 AKA have votes).
  */
export const v1RootGaugeRecipients: {
    // key: rootGaugeAddress
    // value: recipient (mapped from old streamer relationship)
    [key: string]: string;
} = {
    '0xcf5938ca6d9f19c73010c7493e19c02acfa8d24d': '0xaa59736b80cf77d1e7d56b7bba5a8050805f5064',
    '0x6823dca6d70061f2ae2aaa21661795a2294812bf': '0xfaad21203a7856889cb6eb644ab6864e7253107a',
    '0xc3bb46b8196c3f188c6a373a6c4fde792ca78653': '0x9928340f9e1aaad7df1d95e27bd9a5c715202a56',
    '0x2c967d6611c60274db45e0bb34c64fb5f504ede7': '0xdffe97094394680362ec9706a759eb9366d804c2',
    '0x87ae77a8270f223656d9dc40ad51aabfab424b30': '0x9232ee56ab3167e2d77e491fba82babf963ccace',
    '0x19ff30f9b2d32bfb0f21f2db6c6a3a8604eb8c2b': '0x4e646f5d5ec30f8a09a9c9d7960989dcf4c426b5',
    '0x6f825c8bbf67ebb6bc35cf2071dacd2864c3258e': '0x5b6776cd9c51768fc915cad7a7e8f5c4a6331131',
    '0xe42382d005a620faaa1b82543c9c04ed79db03ba': '0x3ac845345fc2d51a3006ed384055cd5acde86441',
    '0xf7c3b4e1edcb00f0230bfe03d937e26a5e654fd4': '0x2aa6fb79efe19a3fce71c46ae48efc16372ed6dd',
    '0x90437a1d2f6c0935dd6056f07f05c068f2a507f9': '0xfb0243ffdc5309a4ec13b9de9111da02294b2571',
    '0x519cce718fcd11ac09194cff4517f12d263be067': '0x251e51b25afa40f2b6b9f05aaf1bc7eaa0551771',
    '0xf0d887c1f5996c91402eb69ab525f028dd5d7578': '0xbdb8da6156722a3d583ee679988b35caccd86bc3',
    '0xe77239359ce4d445fed27c17da23b8024d35e456': '0x75108a554a34bb2846abfb00d889bfd0bb34e1d6',
    '0xad2632513bfd805a63ad3e38d24ee10835877d41': '0xd0039f467e80cba1faaf87999efcae1dd6f30c1d',
    '0x56a65cc666bfe538c5a031942369f6f63eb42240': '0xc04672a31c5ba04912bad418631f9b45e73619ef',
    '0x5a7f39435fd9c381e4932fa2047c9a5136a5e3e7': '0x192a342c462b3caab57da65bd5b6b75cd857c881',
};
