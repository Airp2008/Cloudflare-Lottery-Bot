# Cloudflare-Lottery-Bot

A Telegram lottery bot that runs entirely on Cloudflare Workers. Developed by **Airp**.

## Features

- 🎲 Create lottery events in Telegram groups
- 👥 User participation with automatic drawing
- 🏆 Multiple winner support
- 🔧 Force draw and close lottery options
- 📊 Real-time lottery status tracking

## Commands

- `/start` - Welcome message
- `/help` - Display commands
- `/create <name> <join_text> <max_users> <winners>` - Create lottery
- `/status <join_text>` - Check status
- `/force <join_text>` - Force draw (creator only)
- `/close <join_text>` - Close lottery (creator only)

## Quick Setup

### 1. Deploy to Cloudflare Workers
- Copy the code to your Cloudflare Worker
- Create a KV namespace and bind it as `LOTTERY`
- Set environment variable `ENV_BOT_TOKEN` with your bot token

### 2. Initialize Webhook
```bash
python init.py
```
Follow the prompts to set up your webhook.

## Requirements

- Cloudflare Workers account
- Telegram bot token from [@BotFather](https://t.me/BotFather)
- KV namespace bound as `LOTTERY`
- Environment variable `ENV_BOT_TOKEN` configured

## Usage Example

```
/create "Daily Prize" lucky 10 2
```
Users join by typing `lucky`, max 10 participants, 2 winners.

## Example Bot
[@BaiyunLotteryBot](https://t.me/BaiyunLotteryBot)
---

**Developed by Airp** | [@Airp2008](https://t.me/Airp2008)
