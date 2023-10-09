#!/bin/bash


PASSWORD_FILE="passwords.txt"

welcome_message() {
  echo "パスワードマネージャーへようこそ"
  echo "次の選択技から入力してください(Add Password/Get Password/Exit):"
 }

add_password() {
  echo"サービス名を入力してください:"
  read service_name
  echo "ユーザー名を入力してください:"
  read username
  echo "パスワードを入力してください:"
  read password

  echo "$service_name:$username:$password" >> "$PASSWORD_FILE"
  echo "パスワードの追加は完了しました。"
}

get_password() {
  echo "サービス名を入力してください:"
  read service_name
  

  result=$(grep "^$service_name:" "$PASSWORD_FILE")
  

  if [ -z "$result" ]; then
    echo "そのサービスは登録されていません。"
　　else
     IFS=':' read -ra info <<< "$result"
     echo "サービス名:${info[0]}"
     echo "ユーザー名:"${info[1]}"
     echo "パスワード:"${info[2]}"
   fi
}

while true; do
  welcome_message
  read choice
  

  case "$choice" in
    "Add Password")
    add_password
    ;;
    "Get Password")
     get_password
    ;;
   "Exit")
    echo "Thank you!"
    exit 0
    ;;
    *)
    echo"入力が間違えています。Add Password/Get Password/Exit から入力してください。"
    ;;
  esac
done
