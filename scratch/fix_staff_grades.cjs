const fs = require('fs');

let code = fs.readFileSync('server.js', 'utf8');

// 1. Fix POST /api/staff-grades
const postDestructureTarget = `      const { 
        name, description, region_id,
        leader_daily_base_salary = 0, leader_daily_travel_allowance = 0, leader_point_reward = 0,
        member_daily_base_salary = 0, member_daily_travel_allowance = 0, member_point_reward = 0
      } = req.body;`;
const postDestructureReplace = `      const { 
        name, description, region_id,
        leader_daily_base_salary = 0, leader_daily_travel_allowance = 0, leader_point_reward = 0,
        member_daily_base_salary = 0, member_daily_travel_allowance = 0, member_point_reward = 0,
        leader_monthly_base_salary = 0, leader_monthly_travel_allowance = 0,
        member_monthly_base_salary = 0, member_monthly_travel_allowance = 0
      } = req.body;`;

const postInsertTarget = `        \`INSERT INTO staff_grades (
          id, region_id, name, description,
          leader_daily_base_salary, leader_daily_travel_allowance, leader_point_reward,
          member_daily_base_salary, member_daily_travel_allowance, member_point_reward
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)\`,
        [
          gradeId, targetRegion, name.trim(), description?.trim() || null,
          leader_daily_base_salary, leader_daily_travel_allowance, leader_point_reward,
          member_daily_base_salary, member_daily_travel_allowance, member_point_reward
        ]`;
const postInsertReplace = `        \`INSERT INTO staff_grades (
          id, region_id, name, description,
          leader_daily_base_salary, leader_daily_travel_allowance, leader_point_reward,
          member_daily_base_salary, member_daily_travel_allowance, member_point_reward,
          leader_monthly_base_salary, leader_monthly_travel_allowance,
          member_monthly_base_salary, member_monthly_travel_allowance
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)\`,
        [
          gradeId, targetRegion, name.trim(), description?.trim() || null,
          leader_daily_base_salary, leader_daily_travel_allowance, leader_point_reward,
          member_daily_base_salary, member_daily_travel_allowance, member_point_reward,
          leader_monthly_base_salary, leader_monthly_travel_allowance,
          member_monthly_base_salary, member_monthly_travel_allowance
        ]`;

// 2. Fix PUT /api/staff-grades/:id
const putDestructureTarget = `      const { 
        name, description,
        leader_daily_base_salary = 0, leader_daily_travel_allowance = 0, leader_point_reward = 0,
        member_daily_base_salary = 0, member_daily_travel_allowance = 0, member_point_reward = 0
      } = req.body;`;
const putDestructureReplace = `      const { 
        name, description,
        leader_daily_base_salary = 0, leader_daily_travel_allowance = 0, leader_point_reward = 0,
        member_daily_base_salary = 0, member_daily_travel_allowance = 0, member_point_reward = 0,
        leader_monthly_base_salary = 0, leader_monthly_travel_allowance = 0,
        member_monthly_base_salary = 0, member_monthly_travel_allowance = 0
      } = req.body;`;

const putUpdateTarget = `        \`UPDATE staff_grades SET 
          name = ?, description = ?,
          leader_daily_base_salary = ?, leader_daily_travel_allowance = ?, leader_point_reward = ?,
          member_daily_base_salary = ?, member_daily_travel_allowance = ?, member_point_reward = ?
         WHERE id = ?\`,
        [
          name.trim(), description?.trim() || null,
          leader_daily_base_salary, leader_daily_travel_allowance, leader_point_reward,
          member_daily_base_salary, member_daily_travel_allowance, member_point_reward,
          id
        ]`;
const putUpdateReplace = `        \`UPDATE staff_grades SET 
          name = ?, description = ?,
          leader_daily_base_salary = ?, leader_daily_travel_allowance = ?, leader_point_reward = ?,
          member_daily_base_salary = ?, member_daily_travel_allowance = ?, member_point_reward = ?,
          leader_monthly_base_salary = ?, leader_monthly_travel_allowance = ?,
          member_monthly_base_salary = ?, member_monthly_travel_allowance = ?
         WHERE id = ?\`,
        [
          name.trim(), description?.trim() || null,
          leader_daily_base_salary, leader_daily_travel_allowance, leader_point_reward,
          member_daily_base_salary, member_daily_travel_allowance, member_point_reward,
          leader_monthly_base_salary, leader_monthly_travel_allowance,
          member_monthly_base_salary, member_monthly_travel_allowance,
          id
        ]`;

code = code.replace(postDestructureTarget, postDestructureReplace);
code = code.replace(postInsertTarget, postInsertReplace);
code = code.replace(putDestructureTarget, putDestructureReplace);
code = code.replace(putUpdateTarget, putUpdateReplace);

// We also need to fix GET /api/users/staff and GET /api/staff-grades so they RETURN the fields properly!
// I need to check if GET /api/staff-grades is already selecting * or specific columns.

fs.writeFileSync('server.js', code);
console.log('Patch complete!');
