;= @echo off
;= rem prepare sharp for windows environment
echo "installing sharp for windows"
rm -rf node_modules\sharp
npm install sharp@^0.23.3
