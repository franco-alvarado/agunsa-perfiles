
CREATE SEQUENCE log_id_seq;

CREATE TABLE Log (
                id INTEGER NOT NULL DEFAULT nextval('log_id_seq'),
                nombreUsuario VARCHAR(255) NOT NULL,
                loginUsuario VARCHAR(100) NOT NULL,
                tipo VARCHAR(50) NOT NULL,
                fechaRegistro TIMESTAMP NOT NULL,
                codigoSistema VARCHAR(50) NOT NULL,
                texto VARCHAR(500) NOT NULL,
                nombreSistema VARCHAR(200) NOT NULL,
                CONSTRAINT log_pk PRIMARY KEY (id)
);


ALTER SEQUENCE log_id_seq OWNED BY Log.id;

CREATE SEQUENCE sistema_id_seq;

CREATE TABLE sistema (
                id INTEGER NOT NULL DEFAULT nextval('sistema_id_seq'),
                codigo VARCHAR(100) NOT NULL,
                nombre VARCHAR(255) NOT NULL,
                activo CHAR(1) NOT NULL,
                CONSTRAINT sistema_pk PRIMARY KEY (id)
);


ALTER SEQUENCE sistema_id_seq OWNED BY sistema.id;

CREATE SEQUENCE privilegio_id_seq;

CREATE TABLE privilegio (
                id INTEGER NOT NULL DEFAULT nextval('privilegio_id_seq'),
                codigo VARCHAR(100) NOT NULL,
                id_sistema INTEGER NOT NULL,
                nombre VARCHAR(255) NOT NULL,
                CONSTRAINT privilegio_pk PRIMARY KEY (id)
);


ALTER SEQUENCE privilegio_id_seq OWNED BY privilegio.id;

CREATE SEQUENCE grupo_usuarios_id_seq;

CREATE TABLE grupo_usuarios (
                id INTEGER NOT NULL DEFAULT nextval('grupo_usuarios_id_seq'),
                nombre VARCHAR(255) NOT NULL,
                CONSTRAINT grupo_usuarios_pk PRIMARY KEY (id)
);


ALTER SEQUENCE grupo_usuarios_id_seq OWNED BY grupo_usuarios.id;

CREATE TABLE privilegio_en_grupo (
                id_grupo INTEGER NOT NULL,
                id_privilegio INTEGER NOT NULL,
                CONSTRAINT privilegio_en_grupo_pk PRIMARY KEY (id_grupo, id_privilegio)
);


CREATE TABLE Token_Recuperacion (
                token VARCHAR(255) NOT NULL,
                tiempo_creacion TIMESTAMP NOT NULL,
                login VARCHAR(255) NOT NULL,
                CONSTRAINT token_recuperacion_pk PRIMARY KEY (token)
);


CREATE TABLE Usuario (
                login VARCHAR(255) NOT NULL,
                nombre VARCHAR(255) NOT NULL,
                pwd VARCHAR(255) NOT NULL,
                email VARCHAR(255) NOT NULL,
                activo CHAR(1) NOT NULL,
                admin CHAR(1) NOT NULL,
                CONSTRAINT usuario_pk PRIMARY KEY (login)
);


CREATE TABLE Sesion_Usuario (
                token VARCHAR(255) NOT NULL,
                login VARCHAR(255) NOT NULL,
                map_privilegios TEXT,
                ultima_actividad TIMESTAMP NOT NULL,
                CONSTRAINT sesion_usuario_pk PRIMARY KEY (token)
);


CREATE INDEX ses_login_idx
 ON Sesion_Usuario
 ( login );

CREATE TABLE usuario_en_grupo (
                login VARCHAR(255) NOT NULL,
                id_grupo INTEGER NOT NULL,
                CONSTRAINT usuario_en_grupo_pk PRIMARY KEY (login, id_grupo)
);


ALTER TABLE privilegio ADD CONSTRAINT sistema_privilegio_fk
FOREIGN KEY (id_sistema)
REFERENCES sistema (id)
ON DELETE NO ACTION
ON UPDATE NO ACTION
NOT DEFERRABLE;

ALTER TABLE privilegio_en_grupo ADD CONSTRAINT privilegio_privilegio_en_grupo_fk
FOREIGN KEY (id_privilegio)
REFERENCES privilegio (id)
ON DELETE NO ACTION
ON UPDATE NO ACTION
NOT DEFERRABLE;

ALTER TABLE usuario_en_grupo ADD CONSTRAINT grupo_usuarios_usuario_en_grupo_fk
FOREIGN KEY (id_grupo)
REFERENCES grupo_usuarios (id)
ON DELETE NO ACTION
ON UPDATE NO ACTION
NOT DEFERRABLE;

ALTER TABLE privilegio_en_grupo ADD CONSTRAINT grupo_usuarios_privilegio_en_grupo_fk
FOREIGN KEY (id_grupo)
REFERENCES grupo_usuarios (id)
ON DELETE NO ACTION
ON UPDATE NO ACTION
NOT DEFERRABLE;

ALTER TABLE usuario_en_grupo ADD CONSTRAINT usuario_usuario_en_grupo_fk
FOREIGN KEY (login)
REFERENCES Usuario (login)
ON DELETE NO ACTION
ON UPDATE NO ACTION
NOT DEFERRABLE;

ALTER TABLE Sesion_Usuario ADD CONSTRAINT usuario_sesion_usuario_fk
FOREIGN KEY (login)
REFERENCES Usuario (login)
ON DELETE NO ACTION
ON UPDATE NO ACTION
NOT DEFERRABLE;