<?php


class Scaffold extends BaseModel {
    protected $table = 'scaffolds';
    protected $json = array('data');
    protected $hidden = array('id');

    public static function set ($key,$data){
        if (is_string($key)){
			$key = new Uquery($key);
		}
        
        $val = new Scaffold;

		$val->key = $data['key'];
		$val->key_base = $data['key_base'];
		$val->company = User::currentCompany()->guid;
		$val->created_by = $data['created_by'];
		$val->created_ts = $data['created_ts'];
		$val->title = $data['title'];
		$val->data = $data['data'];
		$val->type = $key->s_type;

		
		$val->save();
		
		return $val;
    }


}