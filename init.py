import requests
import json
import sys
from urllib.parse import urlparse

def print_banner():
    print("=" * 60)
    print("🤖 Telegram Bot Webhook Configuration Tool")
    print("=" * 60)
    print()

def get_bot_token():
    print("📝 Please enter your Telegram Bot Token:")
    print("💡 Tip: Get it from @BotFather, format like: 123456789:ABCdefGHIjklMNOpqrsTUVwxyz")
    print()

    while True:
        token = input("🔑 Bot Token: ").strip()
        if not token:
            print("❌ Token cannot be empty, please try again!")
            continue
        if ':' not in token or len(token) < 35:
            print("❌ Invalid token format, please check and try again!")
            continue
        print("✅ Token format validation passed, verifying bot...")
        return token

def verify_bot(bot_token):
    try:
        url = f"https://api.telegram.org/bot{bot_token}/getMe"
        response = requests.get(url, timeout=10)
        result = response.json()
        if result.get("ok"):
            return True, result.get("result")
        else:
            error_msg = result.get("description", "Unknown error")
            print(f"❌ Bot verification failed: {error_msg}")
            return False, None

    except requests.exceptions.Timeout:
        print("❌ Request timeout, please check your network connection!")
        return False, None
    except requests.exceptions.RequestException as e:
        print(f"❌ Network request failed: {e}")
        return False, None
    except json.JSONDecodeError:
        print("❌ Invalid server response format!")
        return False, None

def display_bot_info(bot_info):
    if not bot_info:
        return

    print("\n" + "=" * 50)
    print("🤖 Bot Information Confirmation")
    print("=" * 50)
    print(f"📛 Bot Name: {bot_info.get('first_name', 'N/A')}")
    print(f"👤 Username: @{bot_info.get('username', 'N/A')}")
    print(f"🆔 Bot ID: {bot_info.get('id', 'N/A')}")


    print("=" * 50)

def confirm_bot():
    while True:
        choice = input("\n✅ Confirm to use this bot? (y/n): ").strip().lower()
        if choice in ['y', 'yes']:
            return True
        elif choice in ['n', 'no']:
            return False
        else:
            print("❌ Please enter y/yes or n/no")

def validate_url(url):
    try:
        result = urlparse(url)
        return all([result.scheme, result.netloc]) and result.scheme in ['http', 'https']
    except:
        return False

def get_webhook_url():
    print("\n📝 Please enter your Webhook URL:")
    print("💡 Tip: Should be a valid HTTPS URL, like: https://your-domain.com/")
    print()

    while True:
        url = input("🌐 Webhook URL: ").strip()

        if not url:
            print("❌ URL cannot be empty, please try again!")
            continue

        if not validate_url(url):
            print("❌ Invalid URL format, please enter a valid HTTP/HTTPS URL!")
            continue

        if not url.startswith('https://'):
            print("⚠️  Warning: Telegram recommends using HTTPS for webhooks")
            confirm = input("Continue with HTTP? (y/n): ").strip().lower()
            if confirm not in ['y', 'yes']:
                continue

        return url
def display_current_webhook(webhook_info):
    if not webhook_info:
        return

    print("\n" + "=" * 50)
    print("🔗 Current Webhook Information")
    print("=" * 50)

    current_url = webhook_info.get('url', 'N/A')
    if current_url != 'N/A':
        print(f"🌐 Current URL: {current_url}")
        print(f"📊 Pending Updates: {webhook_info.get('pending_update_count', 0)}")
        print(f"🔌 Max Connections: {webhook_info.get('max_connections', 40)}")

        if webhook_info.get('last_error_date'):
            print(f"❌ Last Error: {webhook_info.get('last_error_message', 'N/A')}")
    else:
        print("📭 No webhook is currently set")

    print("=" * 50)
def get_webhook_info(bot_token):
    try:
        url = f"https://api.telegram.org/bot{bot_token}/getWebhookInfo"
        response = requests.get(url, timeout=10)
        result = response.json()

        if result.get("ok"):
            return result.get("result")
        else:
            print(f"❌ Failed to get webhook info: {result.get('description')}")
            return None

    except Exception as e:
        print(f"❌ Error getting webhook info: {e}")
        return None


def set_webhook(bot_token, webhook_url):
    try:
        url = f"https://api.telegram.org/bot{bot_token}/setWebhook"
        payload = {
            "url": webhook_url,
            "max_connections": 100,
            "drop_pending_updates": True
        }

        print(f"🔄 Setting webhook: {webhook_url}")
        response = requests.post(url, json=payload, timeout=15)
        result = response.json()

        if result.get("ok"):
            print("✅ Webhook set successfully!")
            return True
        else:
            error_msg = result.get("description", "Unknown error")
            print(f"❌ Failed to set webhook: {error_msg}")
            return False

    except requests.exceptions.Timeout:
        print("❌ Request timeout, please try again!")
        return False
    except Exception as e:
        print(f"❌ Error setting webhook: {e}")
        return False

def main():
    print_banner()
    bot_token = get_bot_token()
    is_valid, bot_info = verify_bot(bot_token)

    if not is_valid:
        print("\n❌ Bot verification failed. Please check your token and try again.")
        sys.exit(1)

    display_bot_info(bot_info)

    if not confirm_bot():
        print("\n❌ Operation cancelled by user.")
        sys.exit(0)

    print("\n🔍 Checking current webhook status...")
    webhook_info = get_webhook_info(bot_token)
    if webhook_info and webhook_info.get('url'):
        change_webhook = input("\n🔄 There is already a webhook set. Do you want to delete the existing webhook and set a new one? (y/n): ").strip().lower()
        if change_webhook in ['y', 'yes']:
            set_webhook(bot_token,"")
        else:
            print("✅ Keeping current webhook configuration.")
            sys.exit(0)

    webhook_url = get_webhook_url()
    print("\n" + "=" * 50)
    print("📋 Configuration Summary")
    print("=" * 50)
    print(f"🤖 Bot: @{bot_info.get('username', 'N/A')}")
    print(f"🌐 Webhook URL: {webhook_url}")
    print("=" * 50)

    final_confirm = input("\n✅ Proceed with webhook setup? (y/n): ").strip().lower()
    if final_confirm not in ['y', 'yes']:
        print("❌ Operation cancelled by user.")
        sys.exit(0)

    if set_webhook(bot_token, webhook_url):
        print("\n🎉 Webhook configuration completed successfully!")
        print("💡 Your bot is now ready to receive updates.")

        print("\n🔍 Verifying webhook configuration...")
        new_webhook_info = get_webhook_info(bot_token)
        if new_webhook_info:
            display_current_webhook(new_webhook_info)
    else:
        print("\n❌ Webhook configuration failed.")
        sys.exit(1)

if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        print("\n\n❌ Operation cancelled by user (Ctrl+C)")
        sys.exit(0)
    except Exception as e:
        print(f"\n❌ Unexpected error: {e}")
        sys.exit(1)
