#!/bin/bash

PASSWORD_FILE="passwords.txt"

echo "パスワードマネージャーへようこそ！"

while true; do
    read -p "次の選択肢から入力してください(Add Password/Get Password/Exit)：" choice

    case "$choice" in
        "Add Password")
            read -p "サービス名を入力してください：" service_name
            read -p "ユーザー名を入力してください：" user_name
            read -p "パスワードを入力してください：" password
            
            echo "${service_name}:${user_name}:${password}" >> "$PASSWORD_FILE"
            
            echo ""
            echo "パスワードの追加は成功しました。"
            ;;
            
        "Get Password")
            read -p "サービス名を入力してください：" search_service
            
            if [ ! -f "$PASSWORD_FILE" ]; then
                touch "$PASSWORD_FILE"
            fi
            
            result=$(grep "^${search_service}:" "$PASSWORD_FILE")

            if [ -z "$result" ]; then
                echo "そのサービスは登録されていません。"
            else
                user=$(echo "$result" | cut -d ':' -f 2)
                pass=$(echo "$result" | cut -d ':' -f 3)
                
                echo "サービス名：$search_service"
                echo "ユーザー名：$user"
                echo "パスワード：$pass"
            fi
            ;;
            
        "Exit")
            echo "Thank you!"
            exit 0
            ;;
            
        *)
            echo "入力が間違えています。Add Password/Get Password/Exit から入力してください。"
            ;;
    esac
done