<?php
define('APIKEY','930D25DC502DF2F0106A37A5FB074591');

function open_json($url,$assoc = false){return @json_decode(file_get_contents($url),$assoc);}  
function save_json($data,$path){$tmp = json_encode($data);file_put_contents($path, $tmp, LOCK_EX);}

function open_backpack($steamid,$onlyTradeable = true){
	$metal = 0;
	$keys = 0;
	
	$bp_item = array();
	$bp_data = open_json('https://api.steampowered.com/IEconItems_440/GetPlayerItems/v0001/?key='.APIKEY.'&SteamID='.$steamid.'&format=json',false);
	
	if (@!$bp_data->result->status){
		$bp_item['success']=false;
		return $bp_item;
	}
	
	if (@$bp_data->result->status==1){
		$schema=open_json(dirname(__FILE__).'/../data/schema.json',true);
		
		foreach($bp_data->result->items as &$item){
			$tradable=true;

			if (isset($item->flag_cannot_craft)){
				if ($item->flag_cannot_craft==true)
				$item->quality = 600;
			}
			
			if (isset($item->flag_cannot_trade)){
				if ($item->flag_cannot_trade)
				$item->quality = 0;
				$tradable = !$onlyTradeable;
			}
			
			switch ($item->defindex)
			{
				case 5000:
					$metal+=2;
					$tradable = !$onlyTradeable;
				break;
				case 5001:
					$metal+=6;
					$tradable = !$onlyTradeable;
				break;
				case 5002:
					$metal+=18;
					$tradable = !$onlyTradeable;
				break;
				case 5021:
					$keys++;
					$tradable = !$onlyTradeable;
				break;
			}
			
			if ($tradable==true){
				if (isset($bp_item['stock'][$item->defindex][$item->quality])){
					$bp_item['stock'][$item->defindex][$item->quality]++;
				}else{
					$bp_item['stock'][$item->defindex][$item->quality]=1;
					$bp_item['schema'][$item->defindex]=$schema[$item->defindex];
				}
			}
				
		}
		
		$bp_item['schema'][5000]=$schema[5000];
		$bp_item['schema'][5001]=$schema[5001];
		$bp_item['schema'][5002]=$schema[5002];
		$bp_item['schema'][5021]=$schema[5021];
		
		$bp_item['metal']=round($metal/18,2);
		$bp_item['keys']=$keys;
		$bp_item['slots']=$bp_data->result->num_backpack_slots;
		$bp_item['used_slots']=count($bp_data->result->items);
		$bp_item['success']=true;
	
		
	}else{
		$bp_item['success']=false;
	}
	return $bp_item;
}

function open_inventory($id,$appid,$contextid)
{
	$url = 'https://steamcommunity.com/inventory/'.$id.'/'.$appid.'/'.$contextid;
	
	$inventory['success'] = false;
	$inventory['count'] = 0;
	
	$data = open_json($url,true);
	
	$inv_item=array();
	$inv_desc=array();
	
	$id = '';
	
	if (@$data['success'])
	{
		$inventory['success'] = true;
		$inventory['count'] = $data['total_inventory_count'];
		
		if($data['total_inventory_count'] == 0)
		{
			return $inventory;
		}
		
		$owner_steamid = $id;
		$assetid_map = array();
		foreach ( $data['assets'] as $k => $v )
		{
			$inv_item[$k]['class']=$v['classid'];
			$inv_item[$k]['instance']=$v['instanceid'];
			$inv_item[$k]['assetid']=$v['assetid'];
			$assetid_map[$v['classid'].'_'.$v['instanceid']] = $v['assetid'];
		}
		
		foreach ( $data['descriptions'] as $k => $v )
		{
			$id = $v['classid'].'_'.$v['instanceid'];
			
			$inv_desc[$id]['name']=$v['name'];
			$inv_desc[$id]['image']=$v['icon_url'];
			$inv_desc[$id]['type']=$v['type'];
			// Inspect link ekle
			$inspect_link = null;
			if (isset($v['actions']) && is_array($v['actions'])) {
				foreach ($v['actions'] as $action) {
					if (isset($action['link']) && strpos($action['link'], 'csgo_econ_action_preview') !== false) {
						$inspect_link = $action['link'];
						break;
					}
				}
			}
			if (!$inspect_link && isset($v['market_actions']) && is_array($v['market_actions'])) {
				foreach ($v['market_actions'] as $action) {
					if (isset($action['link']) && strpos($action['link'], 'csgo_econ_action_preview') !== false) {
						$inspect_link = $action['link'];
						break;
					}
				}
			}
			// Inspect linkteki placeholder'ları doldur
			if ($inspect_link && isset($assetid_map[$id])) {
				$inspect_link = str_replace('%owner_steamid%', $owner_steamid, $inspect_link);
				$inspect_link = str_replace('%assetid%', $assetid_map[$id], $inspect_link);
			}
			$inv_desc[$id]['inspect_link'] = $inspect_link;
			$inv_desc[$id]['assetid'] = isset($assetid_map[$id]) ? $assetid_map[$id] : null;
			$inv_desc[$id]['owner_steamid'] = $owner_steamid;
		}
	}else{
		return $inventory;
	}
	
	$inventory['items'] = array();

	foreach($inv_item as $item)
	{
		if(!isset($inventory[$item['class']]['stock']))
		{
			$tmp = $item['class'].'_'.$item['instance'];
			$inventory['items'][$item['class']]['stock']=1;
			$inventory['items'][$item['class']]['name']=$inv_desc[$tmp]['name'];
			$inventory['items'][$item['class']]['type']=$inv_desc[$tmp]['type'];
			$inventory['items'][$item['class']]['image']=$inv_desc[$tmp]['image'];
			// Inspect linki ekle
			$inventory['items'][$item['class']]['inspect_link']=$inv_desc[$tmp]['inspect_link'];
			$inventory['items'][$item['class']]['assetid']=$inv_desc[$tmp]['assetid'];
			$inventory['items'][$item['class']]['owner_steamid']=$inv_desc[$tmp]['owner_steamid'];
		}
		else
		{
			$inventory['items'][$item['class']]['stock']++;
		}
	}
	
	$inv_desc = array();
	$inv_item = array();
	
	return $inventory;
}

function open_profile($steamid){
$tmp = open_json('http://api.steampowered.com/ISteamUser/GetPlayerSummaries/v0002/?key='.APIKEY.'&SteamIDs='.$steamid.'&format=json',true);

if (empty($tmp['response']['players']))
{
	$profile['name']='Name';
	$profile['steam'] = '';
	$profile['status']=0;
	$profile['url']='#';
	$profile['avatar']='';
	$profile['personastate']='Offline';
	$profile['success'] = false;
}
else
{
	$profile['name']=$tmp['response']['players']['0']['personaname'];
	$profile['steam']=$tmp['response']['players']['0']['steamid'];
	$profile['status']=$tmp['response']['players']['0']['personastate'];
	switch ($profile['status'])
	{
		case 1:
			$profile['personastate']='Online';
		break;

		case 2:
			$profile['personastate']='Busy';
		break;

		case 3:
			$profile['personastate']='Away';
		break;
			
		case 4:
			$profile['personastate']='Snooze';
		break;
		
		case 5:
			$profile['personastate']='Looking to trade';
		break;
		case 6:
			$profile['personastate']='Looking to play';
		break;
		
		default:
		$profile['personastate']='Offline';
	}
	
	$profile['url']=$tmp['response']['players']['0']['profileurl'];
	$profile['avatar']=$tmp['response']['players']['0']['avatarmedium'];
	$profile['success'] = true;
}
return $profile;
}

?>