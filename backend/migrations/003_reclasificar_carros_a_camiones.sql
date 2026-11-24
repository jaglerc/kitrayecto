-- Apply after the backend and frontend with Camión support are serving traffic.
BEGIN;

LOCK TABLE vehiculo, plantillas_check IN SHARE ROW EXCLUSIVE MODE;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM plantillas_check WHERE tipo_vehiculo = 'Camión') THEN
        IF NOT EXISTS (SELECT 1 FROM plantillas_check WHERE tipo_vehiculo = 'Carro') THEN
            RAISE EXCEPTION 'No hay una plantilla de Carro para migrar a Camión';
        END IF;

        UPDATE vehiculo SET tipo_vehiculo = 'Camión' WHERE tipo_vehiculo = 'Carro';

        -- Keep existing checklist IDs valid for drivers with offline submissions.
        UPDATE plantillas_check SET tipo_vehiculo = 'Camión' WHERE tipo_vehiculo = 'Carro';

        INSERT INTO plantillas_check (tipo_vehiculo, titulo, descripcion)
        SELECT 'Carro', titulo, descripcion
        FROM plantillas_check
        WHERE tipo_vehiculo = 'Camión'
        ORDER BY id;
    END IF;
END
$$;

COMMIT;
