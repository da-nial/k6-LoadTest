import {check} from 'k6';
import http from 'k6/http';


export const options = {
    stages: [
        {duration: '15s', target: 150},
        {duration: '30s', target: 150},
        {duration: '15s', target: 0},
    ],
};

export default function () {
    const res = http.get('https://test-api.k6.io/public/crocodiles/');
    check(res, {
        'is status 200': (r) => r.status === 200,
    });
}
