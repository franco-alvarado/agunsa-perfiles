create extension pgcrypto;

update Usuario 
    set nombre = encrypt(cast(nombre as bytea), 'password', '3des'),
        email  = encrypt(cast(email as bytea), 'password', '3des');

update Log 
    set nombreUsuario = encrypt(cast(nombreUsuario as bytea), 'password', '3des');

