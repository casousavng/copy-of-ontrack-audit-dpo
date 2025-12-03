-- Update passwords for all users
-- Password is the same as username (e.g., 'admin' for admin@mousquetaires.com)

-- admin@mousquetaires.com (password: admin)
UPDATE users SET password_hash = '$2b$10$YQ5P5yJ5p5YQ5P5yJ5p5YeKGxJ5sJ5Q5P5yJ5p5YQ5P5yJ5p5Y' WHERE email = 'admin@mousquetaires.com';

-- amont@mousquetaires.com (password: amont)
UPDATE users SET password_hash = '$2b$10$YQ5P5yJ5p5YQ5P5yJ5p5YeKGxJ5sJ5Q5P5yJ5p5YQ5P5yJ5p5Y' WHERE email = 'amont@mousquetaires.com';

-- DOT users (password: dot1, dot2, dot3, dot4)
UPDATE users SET password_hash = '$2b$10$YQ5P5yJ5p5YQ5P5yJ5p5YeKGxJ5sJ5Q5P5yJ5p5YQ5P5yJ5p5Y' WHERE email = 'dot1@mousquetaires.com';
UPDATE users SET password_hash = '$2b$10$YQ5P5yJ5p5YQ5P5yJ5p5YeKGxJ5sJ5Q5P5yJ5p5YQ5P5yJ5p5Y' WHERE email = 'dot2@mousquetaires.com';
UPDATE users SET password_hash = '$2b$10$YQ5P5yJ5p5YQ5P5yJ5p5YeKGxJ5sJ5Q5P5yJ5p5YQ5P5yJ5p5Y' WHERE email = 'dot3@mousquetaires.com';
UPDATE users SET password_hash = '$2b$10$YQ5P5yJ5p5YQ5P5yJ5p5YeKGxJ5sJ5Q5P5yJ5p5YQ5P5yJ5p5Y' WHERE email = 'dot4@mousquetaires.com';

-- Aderente users (password: aderente1, aderente2, ... aderente10)
UPDATE users SET password_hash = '$2b$10$YQ5P5yJ5p5YQ5P5yJ5p5YeKGxJ5sJ5Q5P5yJ5p5YQ5P5yJ5p5Y' WHERE email = 'aderente1@intermarche.pt';
UPDATE users SET password_hash = '$2b$10$YQ5P5yJ5p5YQ5P5yJ5p5YeKGxJ5sJ5Q5P5yJ5p5YQ5P5yJ5p5Y' WHERE email = 'aderente2@intermarche.pt';
UPDATE users SET password_hash = '$2b$10$YQ5P5yJ5p5YQ5P5yJ5p5YeKGxJ5sJ5Q5P5yJ5p5YQ5P5yJ5p5Y' WHERE email = 'aderente3@intermarche.pt';
UPDATE users SET password_hash = '$2b$10$YQ5P5yJ5p5YQ5P5yJ5p5YeKGxJ5sJ5Q5P5yJ5p5YQ5P5yJ5p5Y' WHERE email = 'aderente4@intermarche.pt';
UPDATE users SET password_hash = '$2b$10$YQ5P5yJ5p5YQ5P5yJ5p5YeKGxJ5sJ5Q5P5yJ5p5YQ5P5yJ5p5Y' WHERE email = 'aderente5@intermarche.pt';
UPDATE users SET password_hash = '$2b$10$YQ5P5yJ5p5YQ5P5yJ5p5YeKGxJ5sJ5Q5P5yJ5p5YQ5P5yJ5p5Y' WHERE email = 'aderente6@intermarche.pt';
UPDATE users SET password_hash = '$2b$10$YQ5P5yJ5p5YQ5P5yJ5p5YeKGxJ5sJ5Q5P5yJ5p5YQ5P5yJ5p5Y' WHERE email = 'aderente7@intermarche.pt';
UPDATE users SET password_hash = '$2b$10$YQ5P5yJ5p5YQ5P5yJ5p5YeKGxJ5sJ5Q5P5yJ5p5YQ5P5yJ5p5Y' WHERE email = 'aderente8@intermarche.pt';
UPDATE users SET password_hash = '$2b$10$YQ5P5yJ5p5YQ5P5yJ5p5YeKGxJ5sJ5Q5P5yJ5p5YQ5P5yJ5p5Y' WHERE email = 'aderente9@intermarche.pt';
UPDATE users SET password_hash = '$2b$10$YQ5P5yJ5p5YQ5P5yJ5p5YeKGxJ5sJ5Q5P5yJ5p5YQ5P5yJ5p5Y' WHERE email = 'aderente10@intermarche.pt';
