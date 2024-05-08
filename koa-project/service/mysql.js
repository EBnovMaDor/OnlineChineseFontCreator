const mysql = require("mysql");
const db_config = {
    host: "localhost",
    user: "localhost",
    password: "123456",
    port: "3306",
    database: "testdb"
}
let connect = mysql.createConnection(db_config);
class svgDatabase {
    static addSvg(list) {
        let sqlQuery = 'insert into svg (font,svg_id,startPointX,startPointY,endPointX,endPointY,line,isClose) values (?,?,?,?,?,?,?,?)'
        connect.query(sqlQuery, list, (error, results, fields) => {
            if (error) {
                console.error('Error inserting data:', error);
                return;
            }
            console.log('Data inserted successfully.');
        });
        return;
    }
    static updateSvg(list) {
        let sqlQuery = 'update svg set startPointX = ?,startPointY = ?,endPointX = ?,endPointY = ?,line = ?,isClose = ? where font = ? and svg_id = ?'
        connect.query(sqlQuery, list, (error, results, fields) => {
            if (error) {
                console.error('Error inserting data:', error);
                return;
            }
            console.log('Data update successfully.');
        });
        return;
    }

    static countSvg(list) {
        return new Promise((resolve, reject) => {
            let sqlQuery = 'select count(*) from svg where font = ? and svg_id = ?'
            connect.query(sqlQuery, list, (error, results, fields) => {
                if (error) {
                    console.error('Error inserting data:', error);
                    return;
                }
                // console.log('Data inserted successfully.', results);
                var res = JSON.parse(JSON.stringify(results));
                // console.log(res[0]['count(*)']);
                resolve(res[0]['count(*)']);
            });
        });
    }

    static deleteSvg(list) {
        let sqlQuery = 'delete from svg where font = ? and svg_id = ?'
        connect.query(sqlQuery, list, (error, results, fields) => {
            if (error) {
                console.error('Error inserting data:', error);
                return;
            }
            console.log('Data delete successfully.');
        });
        return;
    }
    
}
module.exports = svgDatabase