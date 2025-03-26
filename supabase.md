| schema_name        |
| ------------------ |
| auth               |
| extensions         |
| graphql            |
| graphql_public     |
| information_schema |
| pg_catalog         |
| pg_temp_10         |
| pg_temp_11         |
| pg_temp_12         |
| pg_temp_13         |
| pg_temp_14         |
| pg_temp_15         |
| pg_temp_16         |
| pg_temp_17         |
| pg_temp_19         |
| pg_temp_20         |
| pg_temp_21         |
| pg_temp_22         |
| pg_temp_23         |
| pg_temp_24         |
| pg_temp_25         |
| pg_temp_26         |
| pg_temp_27         |
| pg_temp_6          |
| pg_temp_8          |
| pg_temp_9          |
| pg_toast           |
| pg_toast_temp_10   |
| pg_toast_temp_11   |
| pg_toast_temp_12   |
| pg_toast_temp_13   |
| pg_toast_temp_14   |
| pg_toast_temp_15   |
| pg_toast_temp_16   |
| pg_toast_temp_17   |
| pg_toast_temp_19   |
| pg_toast_temp_20   |
| pg_toast_temp_21   |
| pg_toast_temp_22   |
| pg_toast_temp_23   |
| pg_toast_temp_24   |
| pg_toast_temp_25   |
| pg_toast_temp_26   |
| pg_toast_temp_27   |
| pg_toast_temp_6    |
| pg_toast_temp_8    |
| pg_toast_temp_9    |
| pgbouncer          |
| pgsodium           |
| pgsodium_masks     |
| public             |
| realtime           |
| storage            |
| vault              |


| table_schema | table_name           |
| ------------ | -------------------- |
| pgsodium     | decrypted_key        |
| pgsodium     | key                  |
| pgsodium     | mask_columns         |
| pgsodium     | masking_rule         |
| pgsodium     | valid_key            |
| public       | ApiIntegrations      |
| public       | Orders               |
| public       | Products             |
| public       | advantage_products   |
| public       | api_integrations     |
| public       | flash_products       |
| public       | integration_settings |
| public       | orders               |
| public       | product_settings     |
| public       | products             |
| public       | sales_data           |
| public       | sessions             |
| public       | stores               |
| public       | users                |
| vault        | decrypted_secrets    |
| vault        | secrets              |


SELECT table_schema, table_name, column_name, data_type 
FROM information_schema.columns
WHERE table_schema NOT IN ('auth', 'storage', 'realtime', 'extensions', 'pg_catalog', 'information_schema')
ORDER BY table_schema, table_name, ordinal_position;


users :

| column_name                 | data_type                |
| --------------------------- | ------------------------ |
| instance_id                 | uuid                     |
| id                          | integer                  |
| email                       | character varying        |
| id                          | uuid                     |
| password                    | character varying        |
| aud                         | character varying        |
| role                        | character varying        |
| first_name                  | character varying        |
| email                       | character varying        |
| last_name                   | character varying        |
| encrypted_password          | character varying        |
| phone                       | character varying        |
| email_confirmed_at          | timestamp with time zone |
| role                        | character varying        |
| subscription_status         | character varying        |
| invited_at                  | timestamp with time zone |
| confirmation_token          | character varying        |
| trial_start_date            | timestamp with time zone |
| confirmation_sent_at        | timestamp with time zone |
| trial_end_date              | timestamp with time zone |
| has_used_trial              | boolean                  |
| recovery_token              | character varying        |
| subscription_plan           | character varying        |
| recovery_sent_at            | timestamp with time zone |
| created_at                  | timestamp with time zone |
| email_change_token_new      | character varying        |
| email_change                | character varying        |
| updated_at                  | timestamp with time zone |
| email_change_sent_at        | timestamp with time zone |
| failed_login_attempts       | integer                  |
| last_sign_in_at             | timestamp with time zone |
| account_locked              | boolean                  |
| account_locked_until        | timestamp with time zone |
| raw_app_meta_data           | jsonb                    |
| last_login_at               | timestamp with time zone |
| raw_user_meta_data          | jsonb                    |
| is_super_admin              | boolean                  |
| last_login_ip               | character varying        |
| created_at                  | timestamp with time zone |
| updated_at                  | timestamp with time zone |
| phone                       | text                     |
| phone_confirmed_at          | timestamp with time zone |
| phone_change                | text                     |
| phone_change_token          | character varying        |
| phone_change_sent_at        | timestamp with time zone |
| confirmed_at                | timestamp with time zone |
| email_change_token_current  | character varying        |
| email_change_confirm_status | smallint                 |
| banned_until                | timestamp with time zone |
| reauthentication_token      | character varying        |
| reauthentication_sent_at    | timestamp with time zone |
| is_sso_user                 | boolean                  |
| deleted_at                  | timestamp with time zone |
| is_anonymous                | boolean                  |