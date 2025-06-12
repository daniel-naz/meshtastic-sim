function encodePropsToBase64(props) {
    const jsonString = JSON.stringify(props);
    const base64 = btoa(encodeURIComponent(jsonString));
    return base64;
}

function decodePropsFromBase64(base64String) {
    const jsonString = decodeURIComponent(atob(base64String));
    return JSON.parse(jsonString);
}

export default {
    decodePropsFromBase64,
    encodePropsToBase64
}