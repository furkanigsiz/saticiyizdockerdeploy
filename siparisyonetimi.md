2. Sipariş Yönetimi

Siparişleri çekmek ve yönetmek için aşağıdaki endpoint'leri kullanabilirsin.
2.1. Sipariş Listesi Çekme

Bir satıcının siparişlerini almak için:
📍 Endpoint:

GET /suppliers/{sellerId}/orders

🔹 Örnek İstek:

GET https://api.trendyol.com/sapigw/suppliers/123456/orders?status=New
Authorization: Basic base64(api_key:api_secret)

🔹 Örnek Yanıt:

{
  "totalElements": 1,
  "content": [
    {
      "orderNumber": "123456789",
      "customer": {
        "firstName": "Ahmet",
        "lastName": "Yılmaz",
        "email": "ahmet@example.com"
      },
      "totalPrice": 1500.00,
      "items": [
        {
          "productId": 98765,
          "quantity": 2,
          "price": 750.00
        }
      ]
    }
  ]
}

2.2. Sipariş Detayı Çekme

Belirli bir siparişin detaylarını almak için:
📍 Endpoint:

GET /suppliers/{sellerId}/orders/{orderNumber}

🔹 Örnek İstek:

GET https://api.trendyol.com/sapigw/suppliers/123456/orders/123456789
Authorization: Basic base64(api_key:api_secret)

🔹 Örnek Yanıt:

{
  "orderNumber": "123456789",
  "customer": {
    "firstName": "Ahmet",
    "lastName": "Yılmaz",
    "email": "ahmet@example.com"
  },
  "totalPrice": 1500.00,
  "items": [
    {
      "productId": 98765,
      "quantity": 2,
      "price": 750.00
    }
  ]
}

2.3. Sipariş Durumu Güncelleme

Sipariş durumunu güncellemek için:
📍 Endpoint:

PUT /suppliers/{sellerId}/orders/status

🔹 Örnek İstek:

PUT https://api.trendyol.com/sapigw/suppliers/123456/orders/status
Content-Type: application/json
Authorization: Basic base64(api_key:api_secret)

{
  "orderNumbers": ["123456789"],
  "status": "Shipped"
}

🔹 Örnek Yanıt:

{
  "message": "Sipariş durumu başarıyla güncellendi."
}