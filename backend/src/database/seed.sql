-- Seed data for Progress Lens Tracker
-- Run this after the schema migration

-- Insert demo users (passwords are hashed versions of 'Admin123' and 'student123')
INSERT INTO users (username, name, password_hash, role) VALUES
('admin', 'Administrator', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj4J/8KzKz2K', 'admin'),
('student', 'Demo Student', '$2b$12$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'student'),
('john_doe', 'John Doe', '$2b$12$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'student'),
('jane_smith', 'Jane Smith', '$2b$12$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'student');

-- Insert sample folders and videos
INSERT INTO videos (title, description, folder, url, position) VALUES
-- Mathematics Folder
('Introduction to Algebra', 'Basic algebraic concepts and operations', 'Mathematics', 'https://example.com/videos/algebra-intro', 1),
('Linear Equations', 'Solving linear equations step by step', 'Mathematics', 'https://example.com/videos/linear-equations', 2),
('Quadratic Functions', 'Understanding quadratic functions and graphs', 'Mathematics', 'https://example.com/videos/quadratic-functions', 3),
('Geometry Basics', 'Introduction to geometric shapes and properties', 'Mathematics', 'https://example.com/videos/geometry-basics', 4),

-- Science Folder
('Physics Fundamentals', 'Basic physics concepts and laws', 'Science', 'https://example.com/videos/physics-fundamentals', 1),
('Chemistry Basics', 'Introduction to chemical reactions', 'Science', 'https://example.com/videos/chemistry-basics', 2),
('Biology Overview', 'Cell structure and function', 'Science', 'https://example.com/videos/biology-overview', 3),
('Earth Science', 'Planetary systems and geology', 'Science', 'https://example.com/videos/earth-science', 4),

-- Programming Folder
('JavaScript Basics', 'Introduction to JavaScript programming', 'Programming', 'https://example.com/videos/javascript-basics', 1),
('HTML and CSS', 'Web development fundamentals', 'Programming', 'https://example.com/videos/html-css', 2),
('React Introduction', 'Building user interfaces with React', 'Programming', 'https://example.com/videos/react-intro', 3),
('Node.js Backend', 'Server-side JavaScript development', 'Programming', 'https://example.com/videos/nodejs-backend', 4),

-- Language Arts Folder
('Grammar Essentials', 'English grammar rules and usage', 'Language Arts', 'https://example.com/videos/grammar-essentials', 1),
('Creative Writing', 'Techniques for creative writing', 'Language Arts', 'https://example.com/videos/creative-writing', 2),
('Literature Analysis', 'Analyzing literary works', 'Language Arts', 'https://example.com/videos/literature-analysis', 3),
('Public Speaking', 'Effective communication skills', 'Language Arts', 'https://example.com/videos/public-speaking', 4);

-- Insert some sample progress data
INSERT INTO progress (user_id, video_id, completed, updated_at) VALUES
-- Student progress (user_id = 2)
(2, 1, true, NOW() - INTERVAL '2 days'),
(2, 2, true, NOW() - INTERVAL '1 day'),
(2, 3, false, NOW() - INTERVAL '1 hour'),
(2, 5, true, NOW() - INTERVAL '3 days'),
(2, 6, false, NOW() - INTERVAL '30 minutes'),

-- John Doe progress (user_id = 3)
(3, 1, true, NOW() - INTERVAL '1 day'),
(3, 2, true, NOW() - INTERVAL '2 hours'),
(3, 3, true, NOW() - INTERVAL '1 hour'),
(3, 4, false, NOW() - INTERVAL '15 minutes'),
(3, 9, true, NOW() - INTERVAL '4 days'),
(3, 10, true, NOW() - INTERVAL '3 days'),

-- Jane Smith progress (user_id = 4)
(4, 1, true, NOW() - INTERVAL '5 days'),
(4, 2, false, NOW() - INTERVAL '2 hours'),
(4, 5, true, NOW() - INTERVAL '1 day'),
(4, 6, true, NOW() - INTERVAL '6 hours'),
(4, 7, false, NOW() - INTERVAL '45 minutes'),
(4, 13, true, NOW() - INTERVAL '2 days'),
(4, 14, true, NOW() - INTERVAL '1 day');
