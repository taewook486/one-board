import { NextRequest, NextResponse } from 'next/server';
import { getAllConfigs, setConfig, bulkUpdateConfigs, resetConfigs, parseConfigValue } from '@/lib/db/config';
import logger from '@/lib/utils/logger';

// Default configs
const DEFAULT_CONFIGS = {
  'site.name': { value: 'One Board', type: 'text' },
  'site.description': { value: '커뮤니티 게시판', type: 'text' },
  'site.defaultSkin': { value: 'basic', type: 'text' },
  'posts.itemsPerPage': { value: '20', type: 'number' },
  'comments.itemsPerPage': { value: '50', type: 'number' },
  'members.allowRegistration': { value: 'true', type: 'boolean' },
  'members.allowGuest': { value: 'false', type: 'boolean' },
};

export async function GET(request: NextRequest) {
  try {
    const configs = await getAllConfigs();

    // Parse values based on type and transform field names
    const parsedConfigs = configs.map(config => ({
      key: config.configKey,
      value: config.configValue || '',
      type: config.configType,
      parsedValue: parseConfigValue(config.configValue || '', config.configType),
    }));

    return NextResponse.json({
      success: true,
      configs: parsedConfigs,
    });
  } catch (error) {
    logger.error('Error fetching configs:', error);
    return NextResponse.json(
      { success: false, error: '설정을 불러오는데 실패했습니다.' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const data = await request.json();

    if (data.action === 'reset') {
      await resetConfigs(DEFAULT_CONFIGS);
      return NextResponse.json({
        success: true,
        message: '설정이 초기화되었습니다.',
      });
    }

    if (data.bulk) {
      await bulkUpdateConfigs(data.configs);
      return NextResponse.json({
        success: true,
        message: '설정이 저장되었습니다.',
      });
    }

    // Single config update
    const { key, value, type } = data;
    await setConfig(key, value, type);

    return NextResponse.json({
      success: true,
      message: '설정이 저장되었습니다.',
    });
  } catch (error) {
    logger.error('Error saving config:', error);
    return NextResponse.json(
      { success: false, error: '설정 저장에 실패했습니다.' },
      { status: 500 }
    );
  }
}
