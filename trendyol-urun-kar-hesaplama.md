

Bir siparişin karı ise aşağıdaki gibi hesaplanır.

Kar tutarı = Satış fiyatı - Ürün Maliyeti - Komisyon Tutarı - Kargo Ücreti - Platform Hizmet Bedeli - Net KDV

Net KDV = Satış KDV - Ürün Maliyeti KDV - Komisyon KDV - Kargo Ücreti KDV - Platform Hizmet Bedeli KDV

Bu formüldeki değerleri şu şekilde elde ediyoruz;

Satış Fiyatı : Trendyol API den çekiliyor.

Ürün Maliyeti : Ürün ayarlarında girdiğiniz değerden alınıyor.

Komisyon Tutarı : Trendyol API den çekiliyor.

Kargo ücreti : Eğer kargo faturası kesilmişse Trendyol API den, eğer henüz fatura kesilmemişse ürün ayarlarında yer alan desi baz alınarak hesaplanır.

Platform hizmet bedeli : Her siparişte sabit değer alınıyor.

Net KDV : Sizin kestiğiniz faturaların KDV sinden , size kesilen faturaların KDV si çıkartılarak hesap ediliyor.

İadelerin gidiş ve dönüş kargo ücreti kar tutarına negatif olarak yansır.