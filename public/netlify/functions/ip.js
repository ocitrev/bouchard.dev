exports.handler = async function(event, context) {

    let client_ip = event.headers['cf-connecting-ip'];

    if (!client_ip) {
        client_ip = event.headers['client-ip']
    }

    return {
        statusCode: 200,
        body: client_ip
    };
}
