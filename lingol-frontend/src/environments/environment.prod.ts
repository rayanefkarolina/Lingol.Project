export const environment = {
  producao: true,

  // As duas APIs rodam na mesma VM, atrás do Caddy, que roteia por caminho.
  // Ver deploy/Caddyfile no repositório do backend.
  cadastroApi: 'https://lingol-api.duckdns.org/cadastro',
  pedagogicoApi: 'https://lingol-api.duckdns.org/pedagogico'
};
