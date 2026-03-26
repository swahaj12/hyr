-- ============================================================
-- DUMMY CANDIDATES FOR TESTING
-- Run this in Supabase SQL Editor AFTER running supabase-hiring-needs.sql
-- ============================================================

-- Step 1: Create dummy users in auth.users (required due to FK constraint)
INSERT INTO auth.users (id, instance_id, aud, role, email, encrypted_password, email_confirmed_at, created_at, updated_at, raw_user_meta_data)
VALUES
('a1111111-1111-1111-1111-111111111111', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'sarah.khan@test.hyr.pk', '$2a$10$abcdefghijklmnopqrstuuABCDEFGHIJKLMNOPQRSTUVWXYZ12345', now(), now(), now(), '{"full_name":"Sarah Khan","role":"candidate"}'::jsonb),
('a2222222-2222-2222-2222-222222222222', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'ahmed.raza@test.hyr.pk', '$2a$10$abcdefghijklmnopqrstuuABCDEFGHIJKLMNOPQRSTUVWXYZ12345', now(), now(), now(), '{"full_name":"Ahmed Raza","role":"candidate"}'::jsonb),
('a3333333-3333-3333-3333-333333333333', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'fatima.ali@test.hyr.pk', '$2a$10$abcdefghijklmnopqrstuuABCDEFGHIJKLMNOPQRSTUVWXYZ12345', now(), now(), now(), '{"full_name":"Fatima Ali","role":"candidate"}'::jsonb),
('a4444444-4444-4444-4444-444444444444', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'usman.tariq@test.hyr.pk', '$2a$10$abcdefghijklmnopqrstuuABCDEFGHIJKLMNOPQRSTUVWXYZ12345', now(), now(), now(), '{"full_name":"Usman Tariq","role":"candidate"}'::jsonb),
('a5555555-5555-5555-5555-555555555555', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'omar.farooq@test.hyr.pk', '$2a$10$abcdefghijklmnopqrstuuABCDEFGHIJKLMNOPQRSTUVWXYZ12345', now(), now(), now(), '{"full_name":"Omar Farooq","role":"candidate"}'::jsonb),
('b1111111-1111-1111-1111-111111111111', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'ayesha.malik@test.hyr.pk', '$2a$10$abcdefghijklmnopqrstuuABCDEFGHIJKLMNOPQRSTUVWXYZ12345', now(), now(), now(), '{"full_name":"Ayesha Malik","role":"candidate"}'::jsonb),
('b2222222-2222-2222-2222-222222222222', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'hassan.javed@test.hyr.pk', '$2a$10$abcdefghijklmnopqrstuuABCDEFGHIJKLMNOPQRSTUVWXYZ12345', now(), now(), now(), '{"full_name":"Hassan Javed","role":"candidate"}'::jsonb),
('b3333333-3333-3333-3333-333333333333', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'zara.hussain@test.hyr.pk', '$2a$10$abcdefghijklmnopqrstuuABCDEFGHIJKLMNOPQRSTUVWXYZ12345', now(), now(), now(), '{"full_name":"Zara Hussain","role":"candidate"}'::jsonb),
('b4444444-4444-4444-4444-444444444444', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'hina.qamar@test.hyr.pk', '$2a$10$abcdefghijklmnopqrstuuABCDEFGHIJKLMNOPQRSTUVWXYZ12345', now(), now(), now(), '{"full_name":"Hina Qamar","role":"candidate"}'::jsonb),
('c1111111-1111-1111-1111-111111111111', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'bilal.ahmed@test.hyr.pk', '$2a$10$abcdefghijklmnopqrstuuABCDEFGHIJKLMNOPQRSTUVWXYZ12345', now(), now(), now(), '{"full_name":"Bilal Ahmed","role":"candidate"}'::jsonb),
('c2222222-2222-2222-2222-222222222222', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'nadia.parveen@test.hyr.pk', '$2a$10$abcdefghijklmnopqrstuuABCDEFGHIJKLMNOPQRSTUVWXYZ12345', now(), now(), now(), '{"full_name":"Nadia Parveen","role":"candidate"}'::jsonb),
('c3333333-3333-3333-3333-333333333333', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'ali.hassan@test.hyr.pk', '$2a$10$abcdefghijklmnopqrstuuABCDEFGHIJKLMNOPQRSTUVWXYZ12345', now(), now(), now(), '{"full_name":"Ali Hassan","role":"candidate"}'::jsonb),
('c4444444-4444-4444-4444-444444444444', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'kamran.yousaf@test.hyr.pk', '$2a$10$abcdefghijklmnopqrstuuABCDEFGHIJKLMNOPQRSTUVWXYZ12345', now(), now(), now(), '{"full_name":"Kamran Yousaf","role":"candidate"}'::jsonb),
('d1111111-1111-1111-1111-111111111111', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'maira.siddiqui@test.hyr.pk', '$2a$10$abcdefghijklmnopqrstuuABCDEFGHIJKLMNOPQRSTUVWXYZ12345', now(), now(), now(), '{"full_name":"Maira Siddiqui","role":"candidate"}'::jsonb),
('d2222222-2222-2222-2222-222222222222', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'imran.shah@test.hyr.pk', '$2a$10$abcdefghijklmnopqrstuuABCDEFGHIJKLMNOPQRSTUVWXYZ12345', now(), now(), now(), '{"full_name":"Imran Shah","role":"candidate"}'::jsonb)
ON CONFLICT (id) DO NOTHING;

-- Step 2: Create identity entries (required by Supabase auth)
INSERT INTO auth.identities (id, user_id, provider_id, identity_data, provider, last_sign_in_at, created_at, updated_at)
SELECT id, id, id, raw_user_meta_data || jsonb_build_object('sub', id::text, 'email', email), 'email', now(), now(), now()
FROM auth.users
WHERE email LIKE '%@test.hyr.pk'
ON CONFLICT DO NOTHING;

-- Step 3: Insert assessment data
-- DevOps Candidates
INSERT INTO assessments (candidate_id, candidate_name, total_score, total_questions, overall_level, assessed_level, domain_scores, tab_switches, personality_type, self_track, self_experience, self_strengths, profile_visible, created_at)
VALUES
-- 1. Sarah Khan — Strong DevOps Senior
('a1111111-1111-1111-1111-111111111111', 'Sarah Khan', 38, 45, 'Senior', 'senior',
'[{"domain":"linux","domainLabel":"Linux","correct":4,"total":4,"pct":100,"level":"Expert"},
  {"domain":"networking","domainLabel":"Networking","correct":3,"total":4,"pct":75,"level":"Proficient"},
  {"domain":"git","domainLabel":"Git","correct":3,"total":3,"pct":100,"level":"Expert"},
  {"domain":"scripting","domainLabel":"Scripting","correct":3,"total":4,"pct":75,"level":"Proficient"},
  {"domain":"cloud","domainLabel":"Cloud / AWS","correct":4,"total":4,"pct":100,"level":"Expert"},
  {"domain":"containers","domainLabel":"Docker","correct":3,"total":4,"pct":75,"level":"Proficient"},
  {"domain":"kubernetes","domainLabel":"Kubernetes","correct":4,"total":4,"pct":100,"level":"Expert"},
  {"domain":"iac","domainLabel":"Terraform / IaC","correct":3,"total":4,"pct":75,"level":"Proficient"},
  {"domain":"cicd","domainLabel":"CI/CD","correct":4,"total":4,"pct":100,"level":"Expert"},
  {"domain":"monitoring","domainLabel":"Monitoring","correct":3,"total":3,"pct":100,"level":"Expert"},
  {"domain":"security","domainLabel":"Security","correct":2,"total":3,"pct":67,"level":"Developing"},
  {"domain":"sre","domainLabel":"SRE","correct":1,"total":2,"pct":50,"level":"Basic"},
  {"domain":"finops","domainLabel":"FinOps","correct":1,"total":2,"pct":50,"level":"Basic"}]'::jsonb,
0, 'The Infrastructure Architect', 'devops', '5-8', '{kubernetes,cloud,iac}', true, now() - interval '3 days'),

-- 2. Ahmed Raza — Mid-Level DevOps
('a2222222-2222-2222-2222-222222222222', 'Ahmed Raza', 28, 45, 'Mid-Level', 'mid',
'[{"domain":"linux","domainLabel":"Linux","correct":3,"total":4,"pct":75,"level":"Proficient"},
  {"domain":"networking","domainLabel":"Networking","correct":2,"total":4,"pct":50,"level":"Basic"},
  {"domain":"git","domainLabel":"Git","correct":3,"total":3,"pct":100,"level":"Expert"},
  {"domain":"scripting","domainLabel":"Scripting","correct":2,"total":4,"pct":50,"level":"Basic"},
  {"domain":"cloud","domainLabel":"Cloud / AWS","correct":3,"total":4,"pct":75,"level":"Proficient"},
  {"domain":"containers","domainLabel":"Docker","correct":3,"total":4,"pct":75,"level":"Proficient"},
  {"domain":"kubernetes","domainLabel":"Kubernetes","correct":2,"total":4,"pct":50,"level":"Basic"},
  {"domain":"iac","domainLabel":"Terraform / IaC","correct":2,"total":4,"pct":50,"level":"Basic"},
  {"domain":"cicd","domainLabel":"CI/CD","correct":3,"total":4,"pct":75,"level":"Proficient"},
  {"domain":"monitoring","domainLabel":"Monitoring","correct":2,"total":3,"pct":67,"level":"Developing"},
  {"domain":"security","domainLabel":"Security","correct":1,"total":3,"pct":33,"level":"Needs Work"},
  {"domain":"sre","domainLabel":"SRE","correct":1,"total":2,"pct":50,"level":"Basic"},
  {"domain":"finops","domainLabel":"FinOps","correct":1,"total":2,"pct":50,"level":"Basic"}]'::jsonb,
1, 'The Pipeline Builder', 'devops', '3-5', '{cicd,containers,cloud}', true, now() - interval '5 days'),

-- 3. Fatima Ali — Junior DevOps (Growing)
('a3333333-3333-3333-3333-333333333333', 'Fatima Ali', 20, 45, 'Junior', 'junior',
'[{"domain":"linux","domainLabel":"Linux","correct":2,"total":4,"pct":50,"level":"Basic"},
  {"domain":"networking","domainLabel":"Networking","correct":1,"total":4,"pct":25,"level":"Needs Work"},
  {"domain":"git","domainLabel":"Git","correct":3,"total":3,"pct":100,"level":"Expert"},
  {"domain":"scripting","domainLabel":"Scripting","correct":2,"total":4,"pct":50,"level":"Basic"},
  {"domain":"cloud","domainLabel":"Cloud / AWS","correct":2,"total":4,"pct":50,"level":"Basic"},
  {"domain":"containers","domainLabel":"Docker","correct":2,"total":4,"pct":50,"level":"Basic"},
  {"domain":"kubernetes","domainLabel":"Kubernetes","correct":1,"total":4,"pct":25,"level":"Needs Work"},
  {"domain":"iac","domainLabel":"Terraform / IaC","correct":1,"total":4,"pct":25,"level":"Needs Work"},
  {"domain":"cicd","domainLabel":"CI/CD","correct":2,"total":4,"pct":50,"level":"Basic"},
  {"domain":"monitoring","domainLabel":"Monitoring","correct":2,"total":3,"pct":67,"level":"Developing"},
  {"domain":"security","domainLabel":"Security","correct":1,"total":3,"pct":33,"level":"Needs Work"},
  {"domain":"sre","domainLabel":"SRE","correct":1,"total":2,"pct":50,"level":"Basic"},
  {"domain":"finops","domainLabel":"FinOps","correct":0,"total":2,"pct":0,"level":"Needs Work"}]'::jsonb,
0, 'The Guardian', 'devops', '1-3', '{linux,git,monitoring}', true, now() - interval '7 days'),

-- 4. Usman Tariq — DevOps Entry Level
('a4444444-4444-4444-4444-444444444444', 'Usman Tariq', 15, 45, 'Entry-Level', 'junior',
'[{"domain":"linux","domainLabel":"Linux","correct":2,"total":4,"pct":50,"level":"Basic"},
  {"domain":"networking","domainLabel":"Networking","correct":1,"total":4,"pct":25,"level":"Needs Work"},
  {"domain":"git","domainLabel":"Git","correct":2,"total":3,"pct":67,"level":"Developing"},
  {"domain":"scripting","domainLabel":"Scripting","correct":1,"total":4,"pct":25,"level":"Needs Work"},
  {"domain":"cloud","domainLabel":"Cloud / AWS","correct":1,"total":4,"pct":25,"level":"Needs Work"},
  {"domain":"containers","domainLabel":"Docker","correct":2,"total":4,"pct":50,"level":"Basic"},
  {"domain":"kubernetes","domainLabel":"Kubernetes","correct":1,"total":4,"pct":25,"level":"Needs Work"},
  {"domain":"iac","domainLabel":"Terraform / IaC","correct":0,"total":4,"pct":0,"level":"Needs Work"},
  {"domain":"cicd","domainLabel":"CI/CD","correct":2,"total":4,"pct":50,"level":"Basic"},
  {"domain":"monitoring","domainLabel":"Monitoring","correct":1,"total":3,"pct":33,"level":"Needs Work"},
  {"domain":"security","domainLabel":"Security","correct":1,"total":3,"pct":33,"level":"Needs Work"},
  {"domain":"sre","domainLabel":"SRE","correct":0,"total":2,"pct":0,"level":"Needs Work"},
  {"domain":"finops","domainLabel":"FinOps","correct":1,"total":2,"pct":50,"level":"Basic"}]'::jsonb,
3, 'The Automation Engineer', 'devops', '0-1', '{linux,docker,cicd}', true, now() - interval '1 day'),

-- Frontend Candidates
-- 5. Ayesha Malik — Strong Frontend Senior
('b1111111-1111-1111-1111-111111111111', 'Ayesha Malik', 35, 40, 'Senior', 'senior',
'[{"domain":"html-css","domainLabel":"HTML & CSS","correct":4,"total":4,"pct":100,"level":"Expert"},
  {"domain":"javascript","domainLabel":"JavaScript","correct":4,"total":4,"pct":100,"level":"Expert"},
  {"domain":"typescript","domainLabel":"TypeScript","correct":3,"total":4,"pct":75,"level":"Proficient"},
  {"domain":"react","domainLabel":"React","correct":4,"total":4,"pct":100,"level":"Expert"},
  {"domain":"performance","domainLabel":"Performance","correct":3,"total":4,"pct":75,"level":"Proficient"},
  {"domain":"accessibility","domainLabel":"Accessibility","correct":3,"total":4,"pct":75,"level":"Proficient"},
  {"domain":"testing","domainLabel":"Testing","correct":3,"total":4,"pct":75,"level":"Proficient"},
  {"domain":"state-mgmt","domainLabel":"State Mgmt","correct":4,"total":4,"pct":100,"level":"Expert"},
  {"domain":"apis","domainLabel":"APIs","correct":4,"total":4,"pct":100,"level":"Expert"},
  {"domain":"build-tools","domainLabel":"Build Tools","correct":3,"total":4,"pct":75,"level":"Proficient"}]'::jsonb,
0, 'The Component Architect', 'frontend', '5-8', '{react,typescript,state-mgmt}', true, now() - interval '2 days'),

-- 6. Hassan Javed — Mid Frontend
('b2222222-2222-2222-2222-222222222222', 'Hassan Javed', 26, 40, 'Mid-Level', 'mid',
'[{"domain":"html-css","domainLabel":"HTML & CSS","correct":3,"total":4,"pct":75,"level":"Proficient"},
  {"domain":"javascript","domainLabel":"JavaScript","correct":3,"total":4,"pct":75,"level":"Proficient"},
  {"domain":"typescript","domainLabel":"TypeScript","correct":2,"total":4,"pct":50,"level":"Basic"},
  {"domain":"react","domainLabel":"React","correct":3,"total":4,"pct":75,"level":"Proficient"},
  {"domain":"performance","domainLabel":"Performance","correct":2,"total":4,"pct":50,"level":"Basic"},
  {"domain":"accessibility","domainLabel":"Accessibility","correct":3,"total":4,"pct":75,"level":"Proficient"},
  {"domain":"testing","domainLabel":"Testing","correct":2,"total":4,"pct":50,"level":"Basic"},
  {"domain":"state-mgmt","domainLabel":"State Mgmt","correct":3,"total":4,"pct":75,"level":"Proficient"},
  {"domain":"apis","domainLabel":"APIs","correct":3,"total":4,"pct":75,"level":"Proficient"},
  {"domain":"build-tools","domainLabel":"Build Tools","correct":2,"total":4,"pct":50,"level":"Basic"}]'::jsonb,
0, 'The JS Wizard', 'frontend', '3-5', '{javascript,react,apis}', true, now() - interval '4 days'),

-- 7. Zara Hussain — Junior Frontend
('b3333333-3333-3333-3333-333333333333', 'Zara Hussain', 18, 40, 'Junior', 'junior',
'[{"domain":"html-css","domainLabel":"HTML & CSS","correct":3,"total":4,"pct":75,"level":"Proficient"},
  {"domain":"javascript","domainLabel":"JavaScript","correct":2,"total":4,"pct":50,"level":"Basic"},
  {"domain":"typescript","domainLabel":"TypeScript","correct":1,"total":4,"pct":25,"level":"Needs Work"},
  {"domain":"react","domainLabel":"React","correct":2,"total":4,"pct":50,"level":"Basic"},
  {"domain":"performance","domainLabel":"Performance","correct":1,"total":4,"pct":25,"level":"Needs Work"},
  {"domain":"accessibility","domainLabel":"Accessibility","correct":2,"total":4,"pct":50,"level":"Basic"},
  {"domain":"testing","domainLabel":"Testing","correct":2,"total":4,"pct":50,"level":"Basic"},
  {"domain":"state-mgmt","domainLabel":"State Mgmt","correct":2,"total":4,"pct":50,"level":"Basic"},
  {"domain":"apis","domainLabel":"APIs","correct":2,"total":4,"pct":50,"level":"Basic"},
  {"domain":"build-tools","domainLabel":"Build Tools","correct":1,"total":4,"pct":25,"level":"Needs Work"}]'::jsonb,
2, 'The Pixel Perfectionist', 'frontend', '1-3', '{html-css,react,accessibility}', true, now() - interval '6 days'),

-- Backend Candidates
-- 8. Bilal Ahmed — Strong Backend Senior
('c1111111-1111-1111-1111-111111111111', 'Bilal Ahmed', 28, 32, 'Senior', 'senior',
'[{"domain":"databases","domainLabel":"Databases","correct":4,"total":4,"pct":100,"level":"Expert"},
  {"domain":"apis-design","domainLabel":"API Design","correct":4,"total":4,"pct":100,"level":"Expert"},
  {"domain":"architecture","domainLabel":"Architecture","correct":3,"total":4,"pct":75,"level":"Proficient"},
  {"domain":"caching","domainLabel":"Caching","correct":4,"total":4,"pct":100,"level":"Expert"},
  {"domain":"messaging","domainLabel":"Messaging","correct":3,"total":4,"pct":75,"level":"Proficient"},
  {"domain":"concurrency","domainLabel":"Concurrency","correct":3,"total":4,"pct":75,"level":"Proficient"},
  {"domain":"observability","domainLabel":"Observability","correct":4,"total":4,"pct":100,"level":"Expert"},
  {"domain":"deployment","domainLabel":"Deployment","correct":3,"total":4,"pct":75,"level":"Proficient"}]'::jsonb,
0, 'The Data Whisperer', 'backend', '5-8', '{databases,caching,architecture}', true, now() - interval '2 days'),

-- 9. Nadia Parveen — Mid Backend
('c2222222-2222-2222-2222-222222222222', 'Nadia Parveen', 22, 32, 'Mid-Level', 'mid',
'[{"domain":"databases","domainLabel":"Databases","correct":3,"total":4,"pct":75,"level":"Proficient"},
  {"domain":"apis-design","domainLabel":"API Design","correct":3,"total":4,"pct":75,"level":"Proficient"},
  {"domain":"architecture","domainLabel":"Architecture","correct":2,"total":4,"pct":50,"level":"Basic"},
  {"domain":"caching","domainLabel":"Caching","correct":3,"total":4,"pct":75,"level":"Proficient"},
  {"domain":"messaging","domainLabel":"Messaging","correct":2,"total":4,"pct":50,"level":"Basic"},
  {"domain":"concurrency","domainLabel":"Concurrency","correct":3,"total":4,"pct":75,"level":"Proficient"},
  {"domain":"observability","domainLabel":"Observability","correct":3,"total":4,"pct":75,"level":"Proficient"},
  {"domain":"deployment","domainLabel":"Deployment","correct":3,"total":4,"pct":75,"level":"Proficient"}]'::jsonb,
1, 'The API Artisan', 'backend', '3-5', '{apis-design,databases,concurrency}', true, now() - interval '4 days'),

-- 10. Ali Hassan — Junior Backend
('c3333333-3333-3333-3333-333333333333', 'Ali Hassan', 15, 32, 'Junior', 'junior',
'[{"domain":"databases","domainLabel":"Databases","correct":2,"total":4,"pct":50,"level":"Basic"},
  {"domain":"apis-design","domainLabel":"API Design","correct":2,"total":4,"pct":50,"level":"Basic"},
  {"domain":"architecture","domainLabel":"Architecture","correct":1,"total":4,"pct":25,"level":"Needs Work"},
  {"domain":"caching","domainLabel":"Caching","correct":2,"total":4,"pct":50,"level":"Basic"},
  {"domain":"messaging","domainLabel":"Messaging","correct":2,"total":4,"pct":50,"level":"Basic"},
  {"domain":"concurrency","domainLabel":"Concurrency","correct":2,"total":4,"pct":50,"level":"Basic"},
  {"domain":"observability","domainLabel":"Observability","correct":2,"total":4,"pct":50,"level":"Basic"},
  {"domain":"deployment","domainLabel":"Deployment","correct":2,"total":4,"pct":50,"level":"Basic"}]'::jsonb,
0, 'The Reliability Engineer', 'backend', '1-3', '{databases,deployment,apis-design}', true, now() - interval '8 days'),

-- QA Candidates
-- 11. Maira Siddiqui — Senior QA
('d1111111-1111-1111-1111-111111111111', 'Maira Siddiqui', 35, 40, 'Senior', 'senior',
'[{"domain":"test-strategy","domainLabel":"Test Strategy","correct":4,"total":4,"pct":100,"level":"Expert"},
  {"domain":"manual-testing","domainLabel":"Manual Testing","correct":4,"total":4,"pct":100,"level":"Expert"},
  {"domain":"automation","domainLabel":"Automation","correct":3,"total":4,"pct":75,"level":"Proficient"},
  {"domain":"api-testing","domainLabel":"API Testing","correct":4,"total":4,"pct":100,"level":"Expert"},
  {"domain":"performance-testing","domainLabel":"Perf Testing","correct":3,"total":4,"pct":75,"level":"Proficient"},
  {"domain":"mobile-testing","domainLabel":"Mobile Testing","correct":3,"total":4,"pct":75,"level":"Proficient"},
  {"domain":"security-testing","domainLabel":"Security Testing","correct":4,"total":4,"pct":100,"level":"Expert"},
  {"domain":"test-data","domainLabel":"Test Data","correct":3,"total":4,"pct":75,"level":"Proficient"},
  {"domain":"bug-tracking","domainLabel":"Bug Tracking","correct":4,"total":4,"pct":100,"level":"Expert"},
  {"domain":"ci-cd-testing","domainLabel":"CI/CD Testing","correct":3,"total":4,"pct":75,"level":"Proficient"}]'::jsonb,
0, 'The Test Strategist', 'qa', '5-8', '{test-strategy,api-testing,security-testing}', true, now() - interval '1 day'),

-- 12. Imran Shah — Mid QA
('d2222222-2222-2222-2222-222222222222', 'Imran Shah', 25, 40, 'Mid-Level', 'mid',
'[{"domain":"test-strategy","domainLabel":"Test Strategy","correct":3,"total":4,"pct":75,"level":"Proficient"},
  {"domain":"manual-testing","domainLabel":"Manual Testing","correct":3,"total":4,"pct":75,"level":"Proficient"},
  {"domain":"automation","domainLabel":"Automation","correct":2,"total":4,"pct":50,"level":"Basic"},
  {"domain":"api-testing","domainLabel":"API Testing","correct":3,"total":4,"pct":75,"level":"Proficient"},
  {"domain":"performance-testing","domainLabel":"Perf Testing","correct":2,"total":4,"pct":50,"level":"Basic"},
  {"domain":"mobile-testing","domainLabel":"Mobile Testing","correct":2,"total":4,"pct":50,"level":"Basic"},
  {"domain":"security-testing","domainLabel":"Security Testing","correct":2,"total":4,"pct":50,"level":"Basic"},
  {"domain":"test-data","domainLabel":"Test Data","correct":3,"total":4,"pct":75,"level":"Proficient"},
  {"domain":"bug-tracking","domainLabel":"Bug Tracking","correct":3,"total":4,"pct":75,"level":"Proficient"},
  {"domain":"ci-cd-testing","domainLabel":"CI/CD Testing","correct":2,"total":4,"pct":50,"level":"Basic"}]'::jsonb,
0, 'The Bug Hunter', 'qa', '3-5', '{manual-testing,bug-tracking,test-strategy}', true, now() - interval '3 days'),

-- More DevOps to make talent pool richer
-- 13. Omar Farooq — Another Mid DevOps (missing Security & IaC)
('a5555555-5555-5555-5555-555555555555', 'Omar Farooq', 25, 45, 'Mid-Level', 'mid',
'[{"domain":"linux","domainLabel":"Linux","correct":3,"total":4,"pct":75,"level":"Proficient"},
  {"domain":"networking","domainLabel":"Networking","correct":2,"total":4,"pct":50,"level":"Basic"},
  {"domain":"git","domainLabel":"Git","correct":3,"total":3,"pct":100,"level":"Expert"},
  {"domain":"scripting","domainLabel":"Scripting","correct":3,"total":4,"pct":75,"level":"Proficient"},
  {"domain":"cloud","domainLabel":"Cloud / AWS","correct":2,"total":4,"pct":50,"level":"Basic"},
  {"domain":"containers","domainLabel":"Docker","correct":3,"total":4,"pct":75,"level":"Proficient"},
  {"domain":"kubernetes","domainLabel":"Kubernetes","correct":2,"total":4,"pct":50,"level":"Basic"},
  {"domain":"iac","domainLabel":"Terraform / IaC","correct":1,"total":4,"pct":25,"level":"Needs Work"},
  {"domain":"cicd","domainLabel":"CI/CD","correct":3,"total":4,"pct":75,"level":"Proficient"},
  {"domain":"monitoring","domainLabel":"Monitoring","correct":2,"total":3,"pct":67,"level":"Developing"},
  {"domain":"security","domainLabel":"Security","correct":0,"total":3,"pct":0,"level":"Needs Work"},
  {"domain":"sre","domainLabel":"SRE","correct":1,"total":2,"pct":50,"level":"Basic"},
  {"domain":"finops","domainLabel":"FinOps","correct":0,"total":2,"pct":0,"level":"Needs Work"}]'::jsonb,
2, 'The Cloud Native', 'devops', '3-5', '{docker,cicd,linux}', true, now() - interval '2 days'),

-- 14. Hina Qamar — Frontend Mid (missing TypeScript & Testing)
('b4444444-4444-4444-4444-444444444444', 'Hina Qamar', 24, 40, 'Mid-Level', 'mid',
'[{"domain":"html-css","domainLabel":"HTML & CSS","correct":4,"total":4,"pct":100,"level":"Expert"},
  {"domain":"javascript","domainLabel":"JavaScript","correct":3,"total":4,"pct":75,"level":"Proficient"},
  {"domain":"typescript","domainLabel":"TypeScript","correct":1,"total":4,"pct":25,"level":"Needs Work"},
  {"domain":"react","domainLabel":"React","correct":3,"total":4,"pct":75,"level":"Proficient"},
  {"domain":"performance","domainLabel":"Performance","correct":2,"total":4,"pct":50,"level":"Basic"},
  {"domain":"accessibility","domainLabel":"Accessibility","correct":3,"total":4,"pct":75,"level":"Proficient"},
  {"domain":"testing","domainLabel":"Testing","correct":1,"total":4,"pct":25,"level":"Needs Work"},
  {"domain":"state-mgmt","domainLabel":"State Mgmt","correct":3,"total":4,"pct":75,"level":"Proficient"},
  {"domain":"apis","domainLabel":"APIs","correct":2,"total":4,"pct":50,"level":"Basic"},
  {"domain":"build-tools","domainLabel":"Build Tools","correct":2,"total":4,"pct":50,"level":"Basic"}]'::jsonb,
1, 'The Pixel Perfectionist', 'frontend', '3-5', '{html-css,react,accessibility}', true, now() - interval '5 days'),

-- 15. Kamran Yousaf — Backend Entry Level
('c4444444-4444-4444-4444-444444444444', 'Kamran Yousaf', 12, 32, 'Entry-Level', 'junior',
'[{"domain":"databases","domainLabel":"Databases","correct":2,"total":4,"pct":50,"level":"Basic"},
  {"domain":"apis-design","domainLabel":"API Design","correct":1,"total":4,"pct":25,"level":"Needs Work"},
  {"domain":"architecture","domainLabel":"Architecture","correct":1,"total":4,"pct":25,"level":"Needs Work"},
  {"domain":"caching","domainLabel":"Caching","correct":1,"total":4,"pct":25,"level":"Needs Work"},
  {"domain":"messaging","domainLabel":"Messaging","correct":2,"total":4,"pct":50,"level":"Basic"},
  {"domain":"concurrency","domainLabel":"Concurrency","correct":1,"total":4,"pct":25,"level":"Needs Work"},
  {"domain":"observability","domainLabel":"Observability","correct":2,"total":4,"pct":50,"level":"Basic"},
  {"domain":"deployment","domainLabel":"Deployment","correct":2,"total":4,"pct":50,"level":"Basic"}]'::jsonb,
4, 'The System Designer', 'backend', '0-1', '{databases,deployment}', true, now() - interval '10 days');

-- Second assessments for some candidates (to show growth / multiple assessments)
INSERT INTO assessments (candidate_id, candidate_name, total_score, total_questions, overall_level, assessed_level, domain_scores, tab_switches, personality_type, self_track, self_experience, self_strengths, profile_visible, created_at)
VALUES
-- Fatima Ali's second attempt (improved)
('a3333333-3333-3333-3333-333333333333', 'Fatima Ali', 25, 45, 'Junior', 'junior',
'[{"domain":"linux","domainLabel":"Linux","correct":3,"total":4,"pct":75,"level":"Proficient"},
  {"domain":"networking","domainLabel":"Networking","correct":2,"total":4,"pct":50,"level":"Basic"},
  {"domain":"git","domainLabel":"Git","correct":3,"total":3,"pct":100,"level":"Expert"},
  {"domain":"scripting","domainLabel":"Scripting","correct":2,"total":4,"pct":50,"level":"Basic"},
  {"domain":"cloud","domainLabel":"Cloud / AWS","correct":2,"total":4,"pct":50,"level":"Basic"},
  {"domain":"containers","domainLabel":"Docker","correct":3,"total":4,"pct":75,"level":"Proficient"},
  {"domain":"kubernetes","domainLabel":"Kubernetes","correct":2,"total":4,"pct":50,"level":"Basic"},
  {"domain":"iac","domainLabel":"Terraform / IaC","correct":1,"total":4,"pct":25,"level":"Needs Work"},
  {"domain":"cicd","domainLabel":"CI/CD","correct":3,"total":4,"pct":75,"level":"Proficient"},
  {"domain":"monitoring","domainLabel":"Monitoring","correct":2,"total":3,"pct":67,"level":"Developing"},
  {"domain":"security","domainLabel":"Security","correct":1,"total":3,"pct":33,"level":"Needs Work"},
  {"domain":"sre","domainLabel":"SRE","correct":1,"total":2,"pct":50,"level":"Basic"},
  {"domain":"finops","domainLabel":"FinOps","correct":1,"total":2,"pct":50,"level":"Basic"}]'::jsonb,
0, 'The Guardian', 'devops', '1-3', '{linux,git,monitoring}', true, now() - interval '1 day'),

-- Hassan Javed's second attempt (improved)
('b2222222-2222-2222-2222-222222222222', 'Hassan Javed', 30, 40, 'Mid-Level', 'mid',
'[{"domain":"html-css","domainLabel":"HTML & CSS","correct":4,"total":4,"pct":100,"level":"Expert"},
  {"domain":"javascript","domainLabel":"JavaScript","correct":3,"total":4,"pct":75,"level":"Proficient"},
  {"domain":"typescript","domainLabel":"TypeScript","correct":3,"total":4,"pct":75,"level":"Proficient"},
  {"domain":"react","domainLabel":"React","correct":3,"total":4,"pct":75,"level":"Proficient"},
  {"domain":"performance","domainLabel":"Performance","correct":3,"total":4,"pct":75,"level":"Proficient"},
  {"domain":"accessibility","domainLabel":"Accessibility","correct":3,"total":4,"pct":75,"level":"Proficient"},
  {"domain":"testing","domainLabel":"Testing","correct":3,"total":4,"pct":75,"level":"Proficient"},
  {"domain":"state-mgmt","domainLabel":"State Mgmt","correct":3,"total":4,"pct":75,"level":"Proficient"},
  {"domain":"apis","domainLabel":"APIs","correct":3,"total":4,"pct":75,"level":"Proficient"},
  {"domain":"build-tools","domainLabel":"Build Tools","correct":2,"total":4,"pct":50,"level":"Basic"}]'::jsonb,
0, 'The JS Wizard', 'frontend', '3-5', '{javascript,react,apis}', true, now() - interval '1 day');
