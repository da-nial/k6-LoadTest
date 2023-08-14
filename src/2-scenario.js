import {check} from 'k6';
import http from 'k6/http';
import {randomIntBetween} from "https://jslib.k6.io/k6-utils/1.0.0/index.js";

const loginData = JSON.parse(open("./users.json"));
const crocosData = JSON.parse(open("./crocos.json"));


const BASE_URL = 'https://test-api.k6.io/'; // make sure this is not production
const LOGIN_URL = BASE_URL + 'auth/token/login/'
const MY_CROCOS_URL = BASE_URL + 'my/crocodiles/'
const PUBLIC_CROCOS_URL = BASE_URL + 'public/crocodiles/'

export const options = {
    thresholds: {
        http_req_failed: ['rate<0.01'], // http errors should be less than 1%
        http_req_duration: ['p(95)<1000'], // 95% of requests should be below 200ms
    },
    scenarios: {
        scenario_1: {
            // name of the executor to use
            executor: 'ramping-arrival-rate',

            // common scenario configuration
            startTime: '0s',
            gracefulStop: '3s',

            // executor-specific configuration
            stages: [
                {duration: '15s', target: 30},
                {duration: '30s', target: 30},
                {duration: '15s', target: 0},
            ],
            preAllocatedVUs: 150, // how large the initial pool of VUs would be
            maxVUs: 300, // if the preAllocatedVUs are not enough, we can initialize more

            // what to execute
            exec: 'scenario_1'
        },
        scenario_2: {
            // name of the executor to use
            executor: 'shared-iterations',

            // common scenario configuration
            startTime: '5s',
            gracefulStop: '3s',

            // executor-specific configuration
            vus: 30,
            iterations: 500,
            maxDuration: '1m',

            // what to execute
            exec: 'scenario_2'
        },

    },
};


export function scenario_1() {
    let publicCrocosRes = http.get(PUBLIC_CROCOS_URL)
    check(publicCrocosRes, {
        "public crocos response status is 200": (r) => r.status === 200, // Unauthorized request will receive HTTP 401
    });
    let numCrocodiles = publicCrocosRes.json().length

    const selectedCrocoRes = http.get(PUBLIC_CROCOS_URL + Math.round(randomIntBetween(1, numCrocodiles)));
    const crocoFields = ['id', 'name', 'sex', 'date_of_birth', 'age']
    check(selectedCrocoRes, {
        "selected croco response status is 200": (r) => r.status === 200, // Unauthorized request will receive HTTP 401
        "selected croco has all croco fields": (r) => hasAllFields(r, crocoFields), // k6 doesn't have schema validation
    });
}

function hasAllFields(r, fields) {
    let hasAllFields = true
    for (const field of fields) {
        hasAllFields = hasAllFields && (field in r.json())
    }
    return hasAllFields
}

export function scenario_2() {
    const loginRes = login()

    const accessToken = loginRes.json()['access']
    const params = {
        headers: {
            'Authorization': 'Bearer ' + accessToken
        }
    };

    let myCrocosRes = http.get(MY_CROCOS_URL, params)
    check(myCrocosRes, {
        "login successful": (r) => r.status === 200, // Unauthorized request will receive HTTP 401
    });

    // Didn't use groups, as wrapping a single http request in a group is discouraged
    create10CocosForStore(params)
}

function login() {
    let credentials = loginData.users[0];

    let loginRes = http.post(LOGIN_URL, {
        username: credentials.username,
        password: credentials.password
    });
    check(loginRes, {
        "login response status is 200": (r) => r.status === 200,
        "refresh token is present": (r) => 'refresh' in r.json(),
        "access token is present": (r) => 'access' in r.json()
    });


    return loginRes
}

function create10CocosForStore(params) {
    let storeNumCrocos = getStoreNumCrocos(params)

    while (storeNumCrocos < 10) {
        let newCroco = crocosData.crocodiles[storeNumCrocos]

        let createCrocoRes = http.post(MY_CROCOS_URL, newCroco, params)
        check(createCrocoRes, {
            "create status code is 201": (r) => r.status === 201,
            "new croco assigned id is present": (r) => 'id' in r.json(),
        });

        storeNumCrocos = getStoreNumCrocos(params)
    }
}

function getStoreNumCrocos(params) {
    let myCrocosRes = http.get(MY_CROCOS_URL, params)
    return myCrocosRes.json().length
}
