use lambda_http::{run, service_fn, Body, Error, Request, Response};
use serde_json::json;

async fn handler(request: Request) -> Result<Response<Body>, Error> {
    let response = match request.uri().path() {
        "/" => json!({
            "name": "tachyon-rust-api-server-sample",
            "version": env!("CARGO_PKG_VERSION"),
            "status": "ok"
        }),
        "/hello" => {
            let name = request
                .uri()
                .query()
                .into_iter()
                .flat_map(|query| form_urlencoded::parse(query.as_bytes()))
                .find(|(key, _)| key == "name")
                .map(|(_, value)| value.into_owned())
                .filter(|name| !name.trim().is_empty())
                .unwrap_or_else(|| "World".to_string());
            json!({ "message": format!("Hello, {name}!") })
        }
        _ => {
            return Ok(Response::builder()
                .status(404)
                .header("content-type", "application/json")
                .body(Body::Text(json!({ "error": "not found" }).to_string()))?);
        }
    };

    Ok(Response::builder()
        .status(200)
        .header("content-type", "application/json")
        .body(Body::Text(response.to_string()))?)
}

#[tokio::main]
async fn main() -> Result<(), Error> {
    run(service_fn(handler)).await
}

#[cfg(test)]
mod tests {
    use lambda_http::{http::Request as HttpRequest, Body};

    use super::handler;

    #[tokio::test]
    async fn root_returns_sample_health_payload() {
        let request = HttpRequest::builder().uri("/").body(Body::Empty).unwrap();
        let response = handler(request).await.unwrap();

        assert_eq!(response.status(), 200);
        let body = response.into_body();
        assert!(matches!(body, Body::Text(ref text) if text.contains("\"status\":\"ok\"")));
    }

    #[tokio::test]
    async fn hello_uses_query_name_and_defaults_to_world() {
        let request = HttpRequest::builder()
            .uri("/hello?name=Rust%20Lambda")
            .body(Body::Empty)
            .unwrap();
        let response = handler(request).await.unwrap();
        assert!(
            matches!(response.into_body(), Body::Text(text) if text.contains("Hello, Rust Lambda!"))
        );

        let request = HttpRequest::builder()
            .uri("/hello")
            .body(Body::Empty)
            .unwrap();
        let response = handler(request).await.unwrap();
        assert!(matches!(response.into_body(), Body::Text(text) if text.contains("Hello, World!")));
    }

    #[tokio::test]
    async fn unknown_routes_return_not_found() {
        let request = HttpRequest::builder()
            .uri("/missing")
            .body(Body::Empty)
            .unwrap();
        let response = handler(request).await.unwrap();

        assert_eq!(response.status(), 404);
    }
}
