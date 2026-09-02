# A Verdinha — Landing Page Tank-G

Landing page estática pronta para GitHub + Vercel.

## O que já está nesta versão

- Identidade visual preto/grafite + verde Tank-G
- Oferta única: Combo Guitarrista Pro por R$67
- Capturas AM3 + AM4 destacadas no Combo Guitarrista Pro
- Catálogo visual de referências de amplificadores e pedais
- Ilustrações próprias dos equipamentos (sem depender de imagens externas)
- Seção de guitarristas famosos
- Foto de Samuel de Azevedo com guitarra e Tank-G
- Checkout Eduzz incorporado, FAQ e CTA final
- Layout responsivo para desktop e celular
- Imagens locais incluídas no projeto

## Configurar checkout

Abra `config.js` e substitua os links:

```js
window.TANKG_CONFIG = {
  checkoutProfissional: "COLE_AQUI_O_LINK_DO_CHECKOUT_R67",
  metaPixelId: "940045260820970"
};
```

## Eventos do Meta Pixel

Esta versão dispara `PageView`, `ViewContent`, `Tempo30`, `Tempo60`, `Tempo120`,
`Scroll25`, `Scroll50`, `Scroll75`, `Scroll90`, `BuyButtonClick`,
`CalculatorBuyIntent`, `InitiateCheckout`, `WhatsAppClick` e `UpsellView`.

O evento `Purchase` não é disparado no clique. Ele deve ser chamado somente na
página de confirmação da Eduzz com `window.truckerCapTrackPurchase(...)`, ou por
uma URL de retorno confiável contendo `tc_purchase=1`, `value` e `order_id`.

## Publicar na Vercel

1. Extraia este ZIP.
2. Envie o conteúdo da pasta `tankg_landing_page` para um repositório no GitHub (você pode renomear a pasta).
3. Na Vercel, clique em **Add New > Project**.
4. Importe o repositório.
5. Não é necessário framework nem build command: é um site HTML/CSS/JS estático.
6. Clique em **Deploy**.

## Observação sobre marcas

Os nomes de amplificadores, pedais e artistas são apresentados como referências sonoras. A página já inclui aviso de não afiliação às respectivas marcas e artistas.
