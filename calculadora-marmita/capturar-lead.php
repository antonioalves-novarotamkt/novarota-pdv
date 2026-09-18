<?php
header('Content-Type: application/json; charset=utf-8');

// Endereço que recebe os contatos capturados pela calculadora.
$destinatario = 'antonio.alves@novarotamkt.com.br';

function respond(bool $success, string $message = ''): void
{
    http_response_code($success ? 200 : 400);
    echo json_encode(['success' => $success, 'message' => $message]);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    respond(false, 'Método não permitido');
}

$corpo = json_decode(file_get_contents('php://input'), true);
if (!is_array($corpo)) {
    respond(false, 'Dados inválidos');
}

// Remove quebras de linha para evitar injeção de cabeçalho de e-mail.
function sanitizarCampo($valor): string
{
    $valor = is_string($valor) ? trim($valor) : '';
    return preg_replace('/[\r\n]+/', ' ', $valor);
}

$nome = sanitizarCampo($corpo['nome'] ?? '');
$telefone = sanitizarCampo($corpo['telefone'] ?? '');
$email = sanitizarCampo($corpo['email'] ?? '');
$custoPorMarmita = is_numeric($corpo['custoPorMarmita'] ?? null) ? (float) $corpo['custoPorMarmita'] : null;
$precoVenda = is_numeric($corpo['precoVenda'] ?? null) ? (float) $corpo['precoVenda'] : null;
$lucro = is_numeric($corpo['lucro'] ?? null) ? (float) $corpo['lucro'] : null;

if ($nome === '' || $telefone === '' || $email === '' || !filter_var($email, FILTER_VALIDATE_EMAIL)) {
    respond(false, 'Preencha nome, telefone e um e-mail válido.');
}

function formatarMoeda(?float $valor): string
{
    if ($valor === null) {
        return 'não informado';
    }
    return 'R$ ' . number_format($valor, 2, ',', '.');
}

$assunto = 'Novo contato pela Calculadora de Marmita';
$mensagem = "Novo lead capturado pela calculadora de custo de marmita:\n\n"
    . "Nome: {$nome}\n"
    . "Telefone/WhatsApp: {$telefone}\n"
    . "E-mail: {$email}\n\n"
    . 'Custo por marmita: ' . formatarMoeda($custoPorMarmita) . "\n"
    . 'Preço de venda sugerido: ' . formatarMoeda($precoVenda) . "\n"
    . 'Lucro por marmita: ' . formatarMoeda($lucro) . "\n";

$dominio = $_SERVER['SERVER_NAME'] ?? 'localhost';
$cabecalhos = "From: Calculadora de Marmita <naoresponder@{$dominio}>\r\n"
    . "Reply-To: {$email}\r\n"
    . "Content-Type: text/plain; charset=UTF-8";

$enviado = @mail($destinatario, $assunto, $mensagem, $cabecalhos);

if (!$enviado) {
    respond(false, 'Não foi possível enviar o e-mail agora.');
}

respond(true, 'Lead registrado com sucesso.');
