// SPDX-License-Identifier: MIT
pragma solidity =0.8.24;

library AddressLibrary {
    address constant VE_PENDLE_CONTRACT = 0x4f30A9D41B80ecC5B94306AB4364951AE3170210; // ETH Mainnet
    address constant PENDLE_TOKEN = 0x808507121B80c02388fAd14726482e061B8da827; // ETH Mainnet
    address constant PENDLE_ROUTER_ADDRESS = 0x0000000001E4ef00d069e71d6bA041b0A16F7eA0; // ETH Mainnet
    address constant PENDLE_ROUTER_STATIC = 0x263833d47eA3fA4a30f269323aba6a107f9eB14C; // ETH Mainnet
    address constant VOTER_CONTRACT = 0x44087E105137a5095c008AaB6a6530182821F2F0; // ETH Mainnet
    address constant VOTER_REWARDS_CLAIMER_ADDRESS = 0x8C237520a8E14D658170A633D96F8e80764433b9; // ETH Mainnet
    address constant WISE_ORACLE_HUB = 0xf8A8EAe0206D36B9ac87Eaa9A229047085aF0178; // ETH Mainnet
    address constant ST_ETH_PENDLE_25DEC_2025 = 0xC374f7eC85F8C7DE3207a10bB1978bA104bdA3B2; // ETH Mainnet
    address constant WISE_DEPLOYER = 0x641AD78BAca220C5BD28b51Ce8e0F495e85Fe689; // ETH Mainnet
    address constant WISE_LENDING = 0x37e49bf3749513A02FA535F0CbC383796E8107E4; // ETH Mainnet
    address constant WETH = 0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2; // ETH Mainnet
    address constant UNI_V3_FACTORY = 0x1F98431c8aD98523631AE4a59f267346ea31F984; // ETH Mainnet
    address constant PENDLE_UNI_POOL_ADDRESS= 0x57aF956d3E2cCa3B86f3D8C6772C03ddca3eAacB; // ETH Mainnet
    address constant PENDLE_UNI_POOL_TOKEN0_ADDRESS = 0x808507121B80c02388fAd14726482e061B8da827; // ETH Mainnet
    address constant PENDLE_UNI_POOL_TOKEN1_ADDRESS = 0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2; // ETH Mainnet
    address constant PENDLE_PT_ORACLE = 0xbbd487268A295531d299c125F3e5f749884A3e30; // ETH Mainnet
    address constant PENDLE_WHALE = 0xF977814e90dA44bFA03b6295A0616a897441aceC; // ETH Mainnet
    address constant PENDLE_LOCK = 0x4f30A9D41B80ecC5B94306AB4364951AE3170210; // ETH Mainnet
    address constant CRV_ETH_FEED = 0x8a12Be339B0cD1829b91Adc01977caa5E9ac121e; // ETH Mainnet
    address constant CRV_TOKEN_ADDRESS = 0xD533a949740bb3306d119CC777fa900bA034cd52; // ETH Mainnet
    address constant ETH_USD_FEED = 0x5f4eC3Df9cbd43714FE2740f5E3616155c5b8419; // ETH Mainnet
    address constant CRVUSD_USD_FEED = 0xEEf0C605546958c1f899b6fB336C20671f9cD49F; // ETH Mainnet
    address constant CRVUSD_TOKEN_ADDRESS = 0xf939E0A03FB07F59A73314E73794Be0E57ac1b4E; // ETH Mainnet
    address constant CRV_UNI_POOL_ADDRESS = 0x919Fa96e88d67499339577Fa202345436bcDaf79; // ETH Mainnet
    address constant CRV_UNI_POOL_TOKEN0_ADDRESS = 0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2; // ETH Mainnet
    address constant CRV_UNI_POOL_TOKEN1_ADDRESS = 0xD533a949740bb3306d119CC777fa900bA034cd52; // ETH Mainnet
    address constant CRVUSD_UNI_POOL_ADDRESS = 0x73eA3D8Ba3D7380201B270ec504b33eD5e478542; // ETH Mainnet
    address constant CRVUSD_UNI_POOL_TOKEN0_ADDRESS = 0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48; // ETH Mainnet
    address constant CRVUSD_UNI_POOL_TOKEN1_ADDRESS = 0xf939E0A03FB07F59A73314E73794Be0E57ac1b4E; // ETH Mainnet
    address constant ETH_USDC_UNI_POOL_ADDRESS = 0x88e6A0c2dDD26FEEb64F039a2c41296FcB3f5640; // ETH Mainnet
    address constant ETH_USDC_UNI_POOL_TOKEN0_ADDRESS = 0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48; // ETH Mainnet
    address constant ETH_USDC_UNI_POOL_TOKEN1_ADDRESS = 0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2; // ETH Mainnet
    address constant CRVUSD_PENDLE_28MAR_2024 = 0xC9beCdbC62efb867cB52222b34c187fB170379C6; // ETH Mainnet
    address constant stEthDec2025LP_WHALE = 0xfF43C5727FbFC31Cb96e605dFD7546eb8862064C; // ETH Mainnet
    address constant crvUsdMar2024LP_WHALE = 0x577eBC5De943e35cdf9ECb5BbE1f7D7CB6c7C647; // ETH Mainnet
    address constant CRV_WHALE = 0xF977814e90dA44bFA03b6295A0616a897441aceC; // ETH Mainnet
    address constant PENDLE_SY_ST_ETH_PENDLE_25DEC_2025 = 0xcbC72d92b2dc8187414F6734718563898740C0BC; // ETH Mainnet

    uint256 constant NINTY_NINE_POINT_NINE = 1 ether - 0.999 ether;
    uint256 constant NINTY_NINE_POINT_SIX = 1 ether - 0.996 ether;
    uint256 constant NINTY_FOUR = 1 ether - 0.94 ether;
    uint24 constant UNI_V3_FEE_PENDLE_UNI_POOL = 3000;
    uint24 constant UNI_V3_FEE_CRV_UNI_POOL = 3000;
    uint24 constant UNI_V3_FEE_CRVUSD_UNI_POOL = 500;
    uint24 constant UNI_V3_FEE_ETH_USDC_UNI_POOL = 500;
    uint16 constant MAX_CARDINALITY = 180;
    uint8 constant DECIMALS_PENDLE_CUSTOM_ORACLE = 18;
}

contract ContractLibrary {
    address constant VE_PENDLE_CONTRACT = AddressLibrary.VE_PENDLE_CONTRACT; // ETH Mainnet
    address constant PENDLE_TOKEN = AddressLibrary.PENDLE_TOKEN; // ETH Mainnet
    address constant PENDLE_ROUTER_ADDRESS = AddressLibrary.PENDLE_ROUTER_ADDRESS; // ETH Mainnet
    address constant PENDLE_ROUTER_STATIC = AddressLibrary.PENDLE_ROUTER_STATIC; // ETH Mainnet
    address constant VOTER_CONTRACT = AddressLibrary.VOTER_CONTRACT; // ETH Mainnet
    address constant VOTER_REWARDS_CLAIMER_ADDRESS = AddressLibrary.VOTER_REWARDS_CLAIMER_ADDRESS; // ETH Mainnet
    address constant WISE_ORACLE_HUB = AddressLibrary.WISE_ORACLE_HUB; // ETH Mainnet
    address constant ST_ETH_PENDLE_25DEC_2025 = AddressLibrary.ST_ETH_PENDLE_25DEC_2025; // ETH Mainnet
    address constant WISE_DEPLOYER = AddressLibrary.WISE_DEPLOYER; // ETH Mainnet
    address constant WISE_LENDING = AddressLibrary.WISE_LENDING; // ETH Mainnet
    address constant WETH = AddressLibrary.WETH; // ETH Mainnet
    address constant UNI_V3_FACTORY = AddressLibrary.UNI_V3_FACTORY; // ETH Mainnet
    address constant PENDLE_UNI_POOL_ADDRESS = AddressLibrary.PENDLE_UNI_POOL_ADDRESS; // ETH Mainnet
    address constant PENDLE_UNI_POOL_TOKEN0_ADDRESS = AddressLibrary.PENDLE_UNI_POOL_TOKEN0_ADDRESS; // ETH Mainnet
    address constant PENDLE_UNI_POOL_TOKEN1_ADDRESS = AddressLibrary.PENDLE_UNI_POOL_TOKEN1_ADDRESS; // ETH Mainnet
    address constant PENDLE_PT_ORACLE = AddressLibrary.PENDLE_PT_ORACLE; // ETH Mainnet
    address constant PENDLE_WHALE = AddressLibrary.PENDLE_WHALE; // ETH Mainnet
    address constant PENDLE_LOCK = AddressLibrary.PENDLE_LOCK; // ETH Mainnet
    address constant CRV_ETH_FEED = AddressLibrary.CRV_ETH_FEED; // ETH Mainnet
    address constant CRV_TOKEN_ADDRESS = AddressLibrary.CRV_TOKEN_ADDRESS; // ETH Mainnet
    address constant ETH_USD_FEED = AddressLibrary.ETH_USD_FEED; // ETH Mainnet
    address constant CRVUSD_USD_FEED = AddressLibrary.CRVUSD_USD_FEED; // ETH Mainnet
    address constant CRVUSD_TOKEN_ADDRESS = AddressLibrary.CRVUSD_TOKEN_ADDRESS; // ETH Mainnet
    address constant CRV_UNI_POOL_ADDRESS = AddressLibrary.CRV_UNI_POOL_ADDRESS; // ETH Mainnet
    address constant CRV_UNI_POOL_TOKEN0_ADDRESS = AddressLibrary.CRV_UNI_POOL_TOKEN0_ADDRESS; // ETH Mainnet
    address constant CRV_UNI_POOL_TOKEN1_ADDRESS = AddressLibrary.CRV_UNI_POOL_TOKEN1_ADDRESS; // ETH Mainnet
    address constant CRVUSD_UNI_POOL_ADDRESS = AddressLibrary.CRVUSD_UNI_POOL_ADDRESS; // ETH Mainnet
    address constant CRVUSD_UNI_POOL_TOKEN0_ADDRESS = AddressLibrary.CRVUSD_UNI_POOL_TOKEN0_ADDRESS; // ETH Mainnet
    address constant CRVUSD_UNI_POOL_TOKEN1_ADDRESS = AddressLibrary.CRVUSD_UNI_POOL_TOKEN1_ADDRESS; // ETH Mainnet
    address constant ETH_USDC_UNI_POOL_ADDRESS = AddressLibrary.ETH_USDC_UNI_POOL_ADDRESS; // ETH Mainnet
    address constant ETH_USDC_UNI_POOL_TOKEN0_ADDRESS = AddressLibrary.ETH_USDC_UNI_POOL_TOKEN0_ADDRESS; // ETH Mainnet
    address constant ETH_USDC_UNI_POOL_TOKEN1_ADDRESS = AddressLibrary.ETH_USDC_UNI_POOL_TOKEN1_ADDRESS; // ETH Mainnet
    address constant CRVUSD_PENDLE_28MAR_2024 = AddressLibrary.CRVUSD_PENDLE_28MAR_2024; // ETH Mainnet
    address constant stEthDec2025LP_WHALE = AddressLibrary.stEthDec2025LP_WHALE; // ETH Mainnet
    address constant crvUsdMar2024LP_WHALE = AddressLibrary.crvUsdMar2024LP_WHALE; // ETH Mainnet
    address constant CRV_WHALE = AddressLibrary.CRV_WHALE; // ETH Mainnet
    address constant PENDLE_SY_ST_ETH_PENDLE_25DEC_2025 = AddressLibrary.PENDLE_SY_ST_ETH_PENDLE_25DEC_2025; // ETH Mainnet
    address constant CURVE_POOL_STETH_ETH = 0xDC24316b9AE028F1497c275EB9192a3Ea0f67022; // ETH Mainnet
    address constant AWETH = 0x4d5F47FA6A74757f35C14fD3a6Ef8E3C9BC514E8; // ETH Mainnet
    address constant AAVE_HUB = 0xCd87EDBb1eCF759162f4F0462CfdD2A913A96C7d; // ETH Mainnet

    uint256 constant NINTY_NINE_POINT_NINE = AddressLibrary.NINTY_NINE_POINT_NINE;
    uint256 constant NINTY_NINE_POINT_SIX = AddressLibrary.NINTY_NINE_POINT_SIX;
    uint256 constant NINTY_FOUR = AddressLibrary.NINTY_FOUR;
    uint24 constant UNI_V3_FEE_PENDLE_UNI_POOL = AddressLibrary.UNI_V3_FEE_PENDLE_UNI_POOL;
    uint24 constant UNI_V3_FEE_CRV_UNI_POOL = AddressLibrary.UNI_V3_FEE_CRV_UNI_POOL;
    uint24 constant UNI_V3_FEE_CRVUSD_UNI_POOL = AddressLibrary.UNI_V3_FEE_CRVUSD_UNI_POOL;
    uint24 constant UNI_V3_FEE_ETH_USDC_UNI_POOL = AddressLibrary.UNI_V3_FEE_ETH_USDC_UNI_POOL;
    uint16 constant MAX_CARDINALITY = AddressLibrary.MAX_CARDINALITY;
    uint8 constant DECIMALS_PENDLE_CUSTOM_ORACLE = AddressLibrary.DECIMALS_PENDLE_CUSTOM_ORACLE;


    // ARB MAIN
    address public constant ARB_PENDLE = 0x0c880f6761F1af8d9Aa9C466984b80DAb9a8c9e8;
    address public constant ARB_WETH = 0x82aF49447D8a07e3bd95BD0d56f35241523fBab1;
    address public constant ARB_WSTETH = 0x5979D7b546E38E414F7E9822514be443A4800529;
    address public constant ARB_AWETH = 0xe50fA9b3c56FfB159cB0FCA61F5c9D750e8128c8;
    address public constant ARB_WISE_ORACLE_ADD = 0x6b8c00c840E8DB20BabAa81D8cb86BB89fa8dcA6;
    address public constant ARB_WISE_LENDING_ADD = 0xc5C6c9b8b9f2831a3134571cBf89651AEEec00fb;
    address public constant ARB_WISE_SECURITY_ADD = 0x62819F430fd51a1BA2634b9c95623072030b668B;
    address public constant ARB_AAVE_HUB_ADD = 0x925a0ED2625EF1d1bE75D7561Ce05fd2F2Dbf1b1;
    address public constant ARB_NFT_ADD = 0x54389BC38845334e82CB67Aaf2c29a66fa2dc80C;
    address public constant ARB_AAVE_ADD = 0x794a61358D6845594F94dc1DB02A252b5b4814aD;
    address public constant ARB_UNISWAP_V3_ROUTER = 0xE592427A0AEce92De3Edee1F18E0157C05861564;
    address public constant ARB_ROUTER_STATIC = 0xAdB09F65bd90d19e3148D9ccb693F3161C6DB3E8;
    address public constant ARB_ROUTER = 0x0000000001E4ef00d069e71d6bA041b0A16F7eA0;
    address public constant ARB_PT_ORACLE = 0x7e16e4253CE4a1C96422a9567B23b4b5Ebc207F1;
    address public constant ARB_MARKET = 0x08a152834de126d2ef83D612ff36e4523FD0017F;
    address public constant ARB_MARKET_SY = 0x80c12D5b6Cc494632Bf11b03F09436c8B61Cc5Df;
    address public constant ARB_PENDLE_UNI_POOL_TOKEN0_ADDRESS = 0x0c880f6761F1af8d9Aa9C466984b80DAb9a8c9e8;
    address public constant ARB_PENDLE_UNI_POOL_TOKEN1_ADDRESS = 0x82aF49447D8a07e3bd95BD0d56f35241523fBab1;
    address public constant ARB_PENDLE_UNI_POOL_ADDRESS = 0xdbaeB7f0DFe3a0AAFD798CCECB5b22E708f7852c;
    address public constant ARB_UNI_V3_FACTORY = 0x1F98431c8aD98523631AE4a59f267346ea31F984;
    uint8 public constant ARB_DECIMALS_PENDLE_CUSTOM_ORACLE = 18;
    uint24 public constant ARB_UNI_V3_FEE_PENDLE_UNI_POOL = 3000;

}
