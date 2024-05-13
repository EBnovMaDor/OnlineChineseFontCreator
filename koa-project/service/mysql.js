const mysql = require("mysql");
const db_config = {
    host: "localhost",
    user: "localhost",
    password: "123456",
    port: "3306",
    database: "testdb",
    useConnectionPooling: true
}
let connect = mysql.createConnection(db_config);
// console.log("connect",connect)
class svgDatabase {
    static addSvg(list) {
        let sqlQuery = 'insert into svg (font,word,svg_id,startPointX,startPointY,endPointX,endPointY,line,isClose,fill) values (?,?,?,?,?,?,?,?,?,?)'
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
        let sqlQuery = 'update svg set startPointX = ?,startPointY = ?,endPointX = ?,endPointY = ?,line = ?,isClose = ?,fill = ? where font = ? and word = ? and svg_id = ?'
        connect.query(sqlQuery, list, (error, results, fields) => {
            if (error) {
                console.error('Error inserting data:', error);
                return;
            }
            console.log('Data update successfully.');
        });
        return;
    }

    static updateSvgFill(list) {
        let sqlQuery = 'update svg set fill = ? where font = ? and word = ? and svg_id = ?'
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
            let sqlQuery = 'select count(*) from svg where font = ? and word = ? and svg_id = ?'
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

    static findSvg(list) {
        return new Promise((resolve, reject) => {
            let sqlQuery = 'select * from svg where font = ? and word = ?'
            connect.query(sqlQuery, list, (error, results, fields) => {
                if (error) {
                    console.error('Error inserting data:', error);
                    return;
                }
                var res = JSON.parse(JSON.stringify(results));
                resolve(res);
            });
        });
    }

    static deleteSvg(list) {
        let sqlQuery = 'delete from svg where font = ? and word = ? and svg_id = ?'
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