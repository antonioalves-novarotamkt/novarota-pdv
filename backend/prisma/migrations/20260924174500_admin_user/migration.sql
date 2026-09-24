-- Conta única de acesso ao sistema (o cadastro público foi removido).
-- Cria o usuário ou, se o email já existir, redefine a senha dele.
-- Só o hash bcrypt fica aqui; a senha em texto foi entregue ao dono da conta.
INSERT INTO "users" ("id", "email", "password", "name", "createdAt", "updatedAt")
VALUES (gen_random_uuid()::text, 'aasilva72@gmail.com', '$2a$12$tifHv1SZ5oYgPcGkMr5Dr.hJNQtITxTYAZjxgtwPa.spn6DPyU4tW', 'Antonio', now(), now())
ON CONFLICT ("email") DO UPDATE SET "password" = EXCLUDED."password", "updatedAt" = now();
