<?php

use Illuminate\Database\Schema\Blueprint;
use Illuminate\Database\Migrations\Migration;

class CreateContentTable extends Migration {

	/**
	 * Run the migrations.
	 *
	 * @return void
	 */
	public function up()
	{
		Schema::create('files', function(Blueprint $table)
		{
		    $table->increments('id');
		    $table->text('path');
		    $table->string('key');
		    $table->string('key_base');
            $table->string('status')->default('active');
            $table->string('company');
		    $table->string('full_path');
		    $table->string('name');
		    $table->string('original_name');
		    $table->string('mime_type');
		    $table->text('related_to');
		    $table->string('user');
		    
		    $table->integer('size');

		    $table->timestamps();
		});
	}

	/**
	 * Reverse the migrations.
	 *
	 * @return void
	 */
	public function down()
	{
		Schema::dropIfExists('files');
		Schema::dropIfExists('content');
	}
}
