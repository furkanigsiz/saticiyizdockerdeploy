Ürün Bilgisi Güncelleme (updateProduct)
ENDPOINT DEĞİŞİKLİĞİ

Mevcut endpointlerimiz Nisan ayında kullanımdan kaldırılacaktır, yeni endpointlerimizi kontrol etmenizi ve gerekli değişiklikleri mümkün olan en kısa sürede yapmanızı rica ederiz.
Ürün Bilgisi Güncelleme

Bu method ile Trendyol mağazanızda createProduct V2 servisiyle oluşturduğunuz ürünleri güncelleyebilirsiniz.

    Bu servis üzerinden sadece ürün bilgileri güncellenmektedir. Stok ve fiyat değerlerini güncellemek için updatePriceAndInventory servisini kullanmanız gerekmektedir.

    Yeni kategori ve kategori özellik değerleri eklenebileceği sebebiyle ürün güncellemelerinizden önce kullandığınız kategori ve kategori özellik değerlerinin güncel olup olmadığını getCategoryTree ve getCategoryAttributes servislerinden kontrol etmenizi öneririz.

    Güncelleme isteğinden sonra "İçerik kontrol bekleniyor." statüsüne geçen ürünleriniz satışa açık durumda olabilir. Sipariş almak istemediğiniz durumlarda stok ve fiyat bilginizi sıfırlamanız gerekmektedir.

    Her bir istek içerisinde gönderilebilecek maksimum item sayısı 1.000'dir.

    Onaylı ürünlerde productMainId değeri güncellenmemektedir.

TOPLU İŞLEM KONTROLU

Ürün güncelleme işlemi sonrasında response içerisinde yer alan batchRequestId ile ürünlerinizin ve aktarım işleminin durumunu getBatchRequestResult servisi üzerinden kontrol etmelisiniz.
PUT updateProducts

Aşağıdaki endpointler Nisan ayında kullanımdan kaldırılacaktır, lütfen aşağıdaki yeni endpointleri kontrol ediniz
PROD - kullanımdan kaldırılacak

https://api.trendyol.com/sapigw/suppliers/{supplierId}/v2/products

YENİ ENDPOINTLER
PROD
https://apigw.trendyol.com/integration/product/sellers/{sellerId}/products
STAGE
https://stageapigw.trendyol.com/integration/product/sellers/{sellerId}/products

Örnek Servis İsteği

{
    "items": [
        {
            "barcode": "barkod-1234",
            "title": "Bebek Takımı Pamuk",
            "productMainId": "1234BT",
            "brandId": 1791,
            "categoryId": 411,
            "stockCode": "STK-123",
            "dimensionalWeight": 12,
            "description": "Ürün açıklama bilgisi",
            "deliveryDuration": 2,
            "vatRate": 0,
            "deliveryOption": {
                "deliveryDuration": 1,
                "fastDeliveryType": "SAME_DAY_SHIPPING|FAST_DELIVERY"
            }
            "images": [
                {
                    "url": "https://www.sampleadress/path/folder/image_1.jpg"
                }
            ],
            "attributes": [
                {
                    "attributeId": 338,
                    "attributeValueId": 6980
                },
                {
                    "attributeId": 343,
                    "attributeValueId": 4294
                },
                {
                    "attributeId": 47,
                    "customAttributeValue": "Attribute özelliği(text olarak girebilirsiniz.)"
                }
            ],
            "cargoCompanyId": 10,
            "shipmentAddressId": 0,
            "returningAddressId": 0
        }
    ]
}

Ürün güncelleme servisi üzerinden ürünlerinize ait güncellenebilir özellik durumları aşağıdaki gibidir:
önemli

Onaylı ürünlerde attribute bilgileri ilgili özelliğe ait "slicer" ve "varianter" değeri "false" ise güncellenebilir. "True" ise güncellenemez. Bu bilgiler değişebileceği için Kategori Özellik Listesi üzerinden güncel durumun takip edilmesi önerilmektedir.
Parametre	Zorunluluk	Açıklama	Veri Tipi	Max. Karakter Sayısı
barcode	Evet	Özel karakter olarak yalnızca "." nokta , "-" tire , "_" alt tire kullanılabilir. Türkçe karakterlerin(ğ, Ğ, Ş, ş, İ, Ü vb) kullanılması uygundur. Barkodunuzun ortasında boşluk varsa birleştirilerek içeri alınır. Stok-fiyat güncellemelerinizi de içeri alınan barkoda göre yapmanız gerekmektedir.	string	40
title	Evet	Ürün ismi	string	100
productMainId	Evet	Ana Ürün Kodu	string	40
brandId	Evet	Trendyol Marka ID Bilgisi. Marka bilgilerini çekeceğiniz servise buradan ulaşabilirsiniz.	integer	-
categoryId	Evet	Trendyol Kategori ID Bilgisi. Kategori bilgilerini çekeceğiniz servise buradan ulaşabilirsiniz.	integer	-
quantity	Evet	Stok miktarı	integer	-
stockCode	Evet	Tedarikçi iç sistemindeki unique stok kodu	string	100
dimensionalWeight	Evet	Desi miktarı	number	-
description	Evet	Ürün açıklama bilgileridir.	HTML - string	30.000
currencyType	Evet	Ürün liste fiyatı para birimidir.	string	-
listPrice	Evet	Ürün liste fiyatı(Satış fiyatı düşük olunca üstü çizilen fiyat) PSF	number	-
salePrice	Evet	Ürün satış fiyatı TSF	number	-
cargoCompanyId	Evet	Trendyol Kargo Firması Bilgisi. Kargo bilgilerini çekeceğiniz servise buradan ulaşabilirsiniz.	integer	-
deliveryDuration	Hayır	Sevkiyat Süresi (Operasyon ekiplerimiz tarafından belirtilen aralıklarda barkod bazlı sevkiyat süresi girebilirsiniz. Göndermediğiniz taktirde varsayılan termin süreniz barkod üzerinde işletilecektir.)	integer	-
deliveryOption	Hayır	Hızlı teslimat seçeneklerinin girilmesini sağlar. SAME_DAY_SHIPPING veya FAST_DELIVERY değerleri "fastDeliveryType" alanından girilebilir.	string	-
images	Evet	Ürün görsellerine ait URL adresi listesidir. Görsel url adresleri SSL sertifikalı "https" formatında adresler olmalıdır. Bir barkod için maksimum 8 adet görsel eklenebilir.Ürünlere ait görsellerin boyutlarının 1200x1800 ve 96dpi olması gerekmektedir.	List	-
vatRate	Evet	Ürün KDV oranı 0,1,10,20 gibi olmalı	integer	-
shipmentAddressId	Hayır	Ürün Trendyol sistemindeki sevkiyat depo adresi ID bilgisi	integer	-
returningAddressId	Hayır	Ürün Trendyol sistemindeki iade depo adresi ID bilgisi	integer	-
attributes	Evet	Ürünün, Kategori bilgisi için gönderilebilecek özellik (Spesification/Attribute) bilgileridir. Özellik bilgilerini çekeceğiniz servise buradan ulaşabilirsiniz. Renk bilgisi 50 karakterden fazla olamaz.	List	-
currencyType	Evet	TRY olarak gönderilmelidir.Ürünlerinize ait fiyatları Türk Lirası üzerinden belirlemeniz gerekmektedir. Döviz kuru bilgisi desteklenmemektedir.	integer	-